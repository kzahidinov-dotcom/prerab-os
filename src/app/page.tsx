'use client';

import React, { useState, useEffect } from 'react';
import { 
  Client, 
  Project, 
  BudgetEstimate, 
  Expense, 
  Invoice, 
  Worker, 
  WorkLog, 
  CompanySettings,
  Task,
  UserProfile,
  SupplierInvoice
} from '@/types';
import { storage } from '@/lib/storage';
import { Sidebar, NavTab } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { OverviewTab } from '@/components/dashboard/OverviewTab';
import { ProjectsTab } from '@/components/projects/ProjectsTab';
import { ProjectDetailModal } from '@/components/projects/ProjectDetailModal';
import { CrmTab } from '@/components/crm/CrmTab';
import { BudgetEstimatorModal } from '@/components/budget/BudgetEstimatorModal';
import { CostTrackingTab } from '@/components/costs/CostTrackingTab';
import { InvoicesTab } from '@/components/invoices/InvoicesTab';
import { SupplierInvoicesTab, isOverdue } from '@/components/supplier-invoices/SupplierInvoicesTab';
import { WorkersTab } from '@/components/workers/WorkersTab';
import { SettingsTab } from '@/components/settings/SettingsTab';
import { NewProjectModal } from '@/components/modals/NewProjectModal';
import { NewExpenseModal } from '@/components/modals/NewExpenseModal';
import { NewInvoiceModal } from '@/components/modals/NewInvoiceModal';
import { SupplierInvoiceModal } from '@/components/modals/SupplierInvoiceModal';
import { auth } from '@/lib/auth';
import { LoginScreen } from '@/components/auth/LoginScreen';
import { DriverWorkspace } from '@/components/driver/DriverWorkspace';
import { ForemanWorkspace } from '@/components/foreman/ForemanWorkspace';
import { PlannerTab } from '@/components/planner/PlannerTab';
import { TaskModal } from '@/components/planner/TaskModal';
import { GanttChart } from '@/components/planner/GanttChart';
import { NotificationToast, showToast } from '@/components/ui/NotificationToast';
import { TeamReportModal } from '@/components/reports/TeamReportModal';
import { checkAndPerformFridayBackup } from '@/lib/backup';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // State loaded from local storage
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [budgets, setBudgets] = useState<BudgetEstimate[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [supplierInvoices, setSupplierInvoices] = useState<SupplierInvoice[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [scheduleStages, setScheduleStages] = useState<Task[]>([]);
  const [settings, setSettings] = useState<CompanySettings>(storage.getSettings());

  // Modals state
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isTeamReportOpen, setIsTeamReportOpen] = useState(false);

  // Modals state
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [newProjectInitialClient, setNewProjectInitialClient] = useState<string | undefined>(undefined);
  const [isNewExpenseOpen, setIsNewExpenseOpen] = useState(false);
  const [newExpenseInitialProject, setNewExpenseInitialProject] = useState<string | undefined>(undefined);
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);
  const [newInvoiceInitialProject, setNewInvoiceInitialProject] = useState<string | undefined>(undefined);
  const [isSupplierInvoiceModalOpen, setIsSupplierInvoiceModalOpen] = useState(false);
  const [supplierInvoiceForEdit, setSupplierInvoiceForEdit] = useState<SupplierInvoice | undefined>(undefined);
  const [isBudgetEstimatorOpen, setIsBudgetEstimatorOpen] = useState(false);
  const [activeBudgetForEdit, setActiveBudgetForEdit] = useState<BudgetEstimate | undefined>(undefined);

  // Initialize and load data
  const loadAllData = () => {
    storage.initSeedData();
    storage.purgePlannerStagesFromTasks();
    setClients(storage.getClients());
    setProjects(storage.getProjects());
    setBudgets(storage.getBudgets());
    setExpenses(storage.getExpenses());
    setInvoices(storage.getInvoices());
    setSupplierInvoices(storage.getSupplierInvoices());
    setWorkers(storage.getWorkers());
    setWorkLogs(storage.getWorkLogs());
    setTasks(storage.getTasks());
    setScheduleStages(storage.getScheduleStages());
    setSettings(storage.getSettings());
  };

  useEffect(() => {
    loadAllData();
    const user = auth.getCurrentUser();
    setCurrentUser(user);
    setIsAuthLoaded(true);

    // 1. Authoritative full fetch from Supabase Cloud
    const runCloudSync = async () => {
      try {
        const ok = await storage.fetchAllFromCloud();
        if (ok) {
          loadAllData();
        }
      } catch (err) {
        console.warn('Silent Supabase fetch skipped:', err);
      }
    };

    runCloudSync();

    // 2. Initialize Supabase Realtime broadcast across all active browsers (Kerim & Vanya)
    storage.initRealtimeSync(() => {
      loadAllData();
    });

    // 3. Periodic cloud heartbeat poll every 10 seconds for 100% data parity
    const cloudInterval = setInterval(runCloudSync, 10000);

    // 4. Silent background sync from Google Sheets on application load
    const runSilentSync = async () => {
      try {
        const { syncFromGoogleSheets } = await import('@/lib/google-sheets-sync');
        const res = await syncFromGoogleSheets();
        if (res.success) {
          loadAllData();
        }
      } catch (err) {
        console.warn('Silent Google sync skipped:', err);
      }
    };

    runSilentSync();

    // 5. Periodic background sync from Google Sheets every 60 seconds
    const interval = setInterval(runSilentSync, 60000);

    // 6. Automatic Friday backup check
    checkAndPerformFridayBackup();

    const handleStorageUpdate = () => {
      loadAllData();
    };

    const handleAuthChange = () => {
      setCurrentUser(auth.getCurrentUser());
    };

    const handleCloudSyncReceived = (e: any) => {
      loadAllData();
      const detail = e?.detail;
      if (detail && detail.author) {
        const activeUser = auth.getCurrentUser();
        // Notify when a colleague makes changes in real-time
        if (detail.author !== activeUser?.name) {
          showToast({
            title: detail.title || '🔔 Синхронизация с облаком',
            message: detail.description || `${detail.author} обновил данные`,
            author: detail.author,
            type: 'sync',
            duration: 6000,
          });
        }
      }
    };

    window.addEventListener('prerab_storage_update', handleStorageUpdate);
    window.addEventListener('prerab_auth_change', handleAuthChange);
    window.addEventListener('prerab_cloud_sync_received', handleCloudSyncReceived);
    return () => {
      clearInterval(interval);
      clearInterval(cloudInterval);
      window.removeEventListener('prerab_storage_update', handleStorageUpdate);
      window.removeEventListener('prerab_auth_change', handleAuthChange);
      window.removeEventListener('prerab_cloud_sync_received', handleCloudSyncReceived);
    };
  }, []);

  // Handlers for data updates
  const handleSaveClient = (client: Client) => {
    const existing = clients.findIndex(c => c.id === client.id);
    let updated: Client[];
    if (existing >= 0) {
      updated = [...clients];
      updated[existing] = client;
    } else {
      updated = [client, ...clients];
    }
    storage.saveClients(updated);
    setClients(updated);
  };

  const handleDeleteClient = (clientId: string) => {
    storage.deleteClient(clientId);
    setClients(storage.getClients());
  };

  const handleSaveProject = (project: Project) => {
    const existing = projects.findIndex(p => p.id === project.id);
    let updated: Project[];
    if (existing >= 0) {
      updated = [...projects];
      updated[existing] = project;
    } else {
      updated = [project, ...projects];
    }
    storage.saveProjects(updated);
    setProjects(updated);
  };

  const handleDeleteProject = (projectId: string) => {
    storage.deleteProject(projectId);
    setProjects(storage.getProjects());
    if (selectedProjectId === projectId) {
      setSelectedProjectId(null);
    }
  };

  const handleSaveBudget = (budget: BudgetEstimate) => {
    const existing = budgets.findIndex(b => b.id === budget.id);
    let updated: BudgetEstimate[];
    if (existing >= 0) {
      updated = [...budgets];
      updated[existing] = budget;
    } else {
      updated = [budget, ...budgets];
    }
    storage.saveBudgets(updated);
    setBudgets(updated);

    // Sync project estimated price with budget
    const targetProj = projects.find(p => p.id === budget.project_id);
    if (targetProj) {
      handleSaveProject({
        ...targetProj,
        budget_estimated: budget.total_client_price,
        budget_cost_estimated: budget.total_cost,
      });
    }
  };

  const handleSaveExpense = (expense: Expense) => {
    const existing = expenses.findIndex(e => e.id === expense.id);
    let updated: Expense[];
    if (existing >= 0) {
      updated = [...expenses];
      updated[existing] = expense;
    } else {
      updated = [expense, ...expenses];
    }
    storage.saveExpenses(updated);
    setExpenses(updated);
  };

  const handleDeleteExpense = (expenseId: string) => {
    storage.deleteExpense(expenseId);
    setExpenses(storage.getExpenses());
  };

  const handleSaveInvoice = (invoice: Invoice) => {
    const existing = invoices.findIndex(i => i.id === invoice.id);
    let updated: Invoice[];
    if (existing >= 0) {
      updated = [...invoices];
      updated[existing] = invoice;
    } else {
      updated = [invoice, ...invoices];
    }
    storage.saveInvoices(updated);
    setInvoices(updated);
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    storage.deleteInvoice(invoiceId);
    setInvoices(storage.getInvoices());
  };

  // Фактуры на уплату (входящие фактуры поставщиков)
  const handleSaveSupplierInvoice = (invoice: SupplierInvoice) => {
    storage.saveSupplierInvoice(invoice);
    setSupplierInvoices(storage.getSupplierInvoices());
  };

  const handleDeleteSupplierInvoice = (invoiceId: string) => {
    storage.deleteSupplierInvoice(invoiceId);
    setSupplierInvoices(storage.getSupplierInvoices());
  };

  const handleMarkSupplierInvoicePaid = (
    invoiceId: string,
    payment: { paid_at: string; paid_amount: number; paid_by: string; payment_method: 'bank_transfer' | 'cash' | 'card' }
  ) => {
    storage.markSupplierInvoicePaid(invoiceId, payment);
    setSupplierInvoices(storage.getSupplierInvoices());
  };

  const handleMarkSupplierInvoiceUnpaid = (invoiceId: string) => {
    storage.markSupplierInvoiceUnpaid(invoiceId);
    setSupplierInvoices(storage.getSupplierInvoices());
  };

  const handlePushSupplierInvoiceToExpenses = (invoiceId: string) => {
    const result = storage.pushSupplierInvoiceToExpenses(invoiceId);
    setSupplierInvoices(storage.getSupplierInvoices());
    setExpenses(storage.getExpenses());
    if (!result) return;

    const targetProject = projects.find(p => p.id === result.expense.project_id);
    showToast({
      title: result.wasUpdate ? '🧾 Расход обновлен' : '🧾 Фактура проведена в расходы',
      message: `${result.expense.vendor}: ${result.expense.amount_with_vat.toFixed(2)} € — ${targetProject ? targetProject.title : 'общие расходы фирмы'}`,
      type: 'sync',
      duration: 5000,
    });
  };

  const handleSaveWorker = (worker: Worker) => {
    const existing = workers.findIndex(w => w.id === worker.id);
    let updated: Worker[];
    if (existing >= 0) {
      updated = [...workers];
      updated[existing] = worker;
    } else {
      updated = [worker, ...workers];
    }
    storage.saveWorkers(updated);
    setWorkers(updated);
  };

  const handleDeleteWorker = (workerId: string) => {
    storage.deleteWorker(workerId);
    setWorkers(storage.getWorkers());
  };

  const handleSaveWorkLog = (log: WorkLog) => {
    const existing = workLogs.findIndex(w => w.id === log.id);
    let updated: WorkLog[];
    if (existing >= 0) {
      updated = [...workLogs];
      updated[existing] = log;
    } else {
      updated = [log, ...workLogs];
    }
    storage.saveWorkLogs(updated);
    setWorkLogs(updated);
  };

  const handleDeleteWorkLog = (logId: string) => {
    storage.deleteWorkLog(logId);
    setWorkLogs(storage.getWorkLogs());
  };

  const handleSaveSettings = (newSettings: CompanySettings) => {
    storage.saveSettings(newSettings);
    setSettings(newSettings);
  };

  const handleSaveTask = (task: Task) => {
    setTasks(prev => {
      const existingIndex = prev.findIndex(t => t.id === task.id);
      let updatedTasks: Task[];
      if (existingIndex >= 0) {
        updatedTasks = [...prev];
        updatedTasks[existingIndex] = task;
      } else {
        updatedTasks = [task, ...prev];
      }
      storage.saveTasks(updatedTasks);
      return updatedTasks;
    });
  };

  const handleSaveTasksBatch = (batch: Task[]) => {
    setTasks(prev => {
      const taskMap = new Map<string, Task>();
      prev.forEach(t => taskMap.set(t.id, t));
      batch.forEach(t => taskMap.set(t.id, t));
      const updatedTasks = Array.from(taskMap.values());
      storage.saveTasks(updatedTasks);
      return updatedTasks;
    });
  };

  const handleDeleteTask = (taskId: string) => {
    storage.deleteTask(taskId);
    setTasks(storage.getTasks());
  };

  const handleToggleTaskStatus = (taskId: string) => {
    storage.toggleTaskStatus(taskId);
    setTasks(storage.getTasks());
  };

  // Dedicated Schedule Stages handlers (План-график объектов / Гант)
  const handleSaveScheduleStage = (stage: Task) => {
    setScheduleStages(prev => {
      const existingIndex = prev.findIndex(s => s.id === stage.id);
      let updated: Task[];
      const marked = { ...stage, is_stage: true };
      if (existingIndex >= 0) {
        updated = [...prev];
        updated[existingIndex] = marked;
      } else {
        updated = [marked, ...prev];
      }
      storage.saveScheduleStages(updated);
      return updated;
    });
  };

  const handleSaveScheduleStagesBatch = (batch: Task[]) => {
    setScheduleStages(prev => {
      const stageMap = new Map<string, Task>();
      prev.forEach(s => stageMap.set(s.id, s));
      batch.forEach(s => stageMap.set(s.id, { ...s, is_stage: true }));
      const updated = Array.from(stageMap.values());
      storage.saveScheduleStages(updated);
      return updated;
    });
  };

  const handleDeleteScheduleStage = (stageId: string) => {
    storage.deleteScheduleStage(stageId);
    setScheduleStages(storage.getScheduleStages());
  };

  const handleToggleScheduleStageStatus = (stageId: string) => {
    storage.toggleScheduleStageStatus(stageId);
    setScheduleStages(storage.getScheduleStages());
  };

  const handleSyncGoogleSheets = async () => {
    const { syncFromGoogleSheets } = await import('@/lib/google-sheets-sync');
    const result = await syncFromGoogleSheets();
    if (result.success) {
      loadAllData();
      alert(result.message);
    } else {
      alert(`Ошибка синхронизации: ${result.message}`);
    }
  };

  const unpaidInvoicesCount = (invoices || []).filter(i => i && i.payment_status !== 'paid').length;
  const unpaidSupplierInvoices = (supplierInvoices || []).filter(i => i && i.payment_status !== 'paid');
  const overdueSupplierInvoicesCount = unpaidSupplierInvoices.filter(isOverdue).length;
  const selectedProject = (projects || []).find(p => p && p.id === selectedProjectId);
  const selectedProjectClient = (clients || []).find(c => c && c.id === selectedProject?.client_id);

  // 1. If not authenticated, show luxury Login Screen
  if (isAuthLoaded && !currentUser) {
    return <LoginScreen onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  // 2. If Driver (Vito), show dedicated Driver Workspace
  if (currentUser?.role === 'driver') {
    return (
      <>
        <NotificationToast />
        <DriverWorkspace
          user={currentUser}
          onLogout={() => auth.logout()}
          onExpenseAdded={loadAllData}
        />
      </>
    );
  }

  // 3. If Foreman (Site manager), show Foreman Workspace
  if (currentUser?.role === 'foreman') {
    return (
      <>
        <NotificationToast />
        <ForemanWorkspace
          user={currentUser}
          projects={projects}
          workers={workers}
          onLogout={() => auth.logout()}
          onExpenseAdded={loadAllData}
        />
      </>
    );
  }

  // 4. Admin View (Full Management ERP / CRM / Financials)
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 relative">
      {/* Top Right Floating Sound & Visual Notifications */}
      <NotificationToast />

      {/* Background Security Watermark Overlay */}
      <div className="security-watermark-overlay" />
      <div className="security-watermark-stamp">
        <div className="text-[10px] font-black text-brand-700 uppercase tracking-widest bg-brand-50/80 px-2 py-1 rounded border border-brand-200 shadow-sm">
          PRERAB &middot; INTERNAL OS &middot; CONFIDENTIAL
        </div>
      </div>

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(t) => {
          setActiveTab(t);
          if (t === 'budget') {
            setIsBudgetEstimatorOpen(true);
          }
        }}
        projectCount={(projects || []).filter(p => p && p.status === 'in_progress').length}
        unpaidInvoicesCount={unpaidInvoicesCount}
        pendingExpensesCount={(expenses || []).length}
        tasksCount={(tasks || []).filter(t => t && t.status !== 'done').length}
        unpaidSupplierInvoicesCount={unpaidSupplierInvoices.length}
        overdueSupplierInvoicesCount={overdueSupplierInvoicesCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          activeTab={activeTab}
          currentUser={currentUser}
          onLogout={() => auth.logout()}
          onSwitchUser={() => setCurrentUser(null)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSyncGoogleSheets={handleSyncGoogleSheets}
          onOpenTeamReport={() => setIsTeamReportOpen(true)}
          onOpenNewProject={() => {
            setNewProjectInitialClient(undefined);
            setIsNewProjectOpen(true);
          }}
          onOpenNewClient={() => {
            setActiveTab('crm');
          }}
          onOpenNewExpense={() => {
            setNewExpenseInitialProject(undefined);
            setIsNewExpenseOpen(true);
          }}
          onOpenNewInvoice={() => {
            setNewInvoiceInitialProject(undefined);
            setIsNewInvoiceOpen(true);
          }}
          onOpenNewBudget={() => {
            setActiveBudgetForEdit(undefined);
            setIsBudgetEstimatorOpen(true);
          }}
          onOpenNewTask={() => {
            setIsNewTaskModalOpen(true);
          }}
        />

        {/* Dynamic Tab Body */}
        <main id="main-scroll-container" className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <OverviewTab
              projects={projects}
              clients={clients}
              expenses={expenses}
              invoices={invoices}
              budgets={budgets}
              tasks={tasks}
              currentUser={currentUser}
              onSelectProject={(pId) => setSelectedProjectId(pId)}
              onOpenNewExpense={() => setIsNewExpenseOpen(true)}
              onOpenNewInvoice={() => setIsNewInvoiceOpen(true)}
              onNavigateTab={setActiveTab}
              onSyncGoogleSheets={handleSyncGoogleSheets}
              onToggleTaskStatus={handleToggleTaskStatus}
              onOpenNewTask={() => setIsNewTaskModalOpen(true)}
            />
          )}

          {activeTab === 'planner' && (
            <PlannerTab
              tasks={tasks}
              projects={projects}
              users={auth.getUsers()}
              currentUserId={currentUser?.id}
              onSaveTask={handleSaveTask}
              onSaveTasksBatch={handleSaveTasksBatch}
              onDeleteTask={handleDeleteTask}
              onToggleTaskStatus={handleToggleTaskStatus}
            />
          )}

          {activeTab === 'gantt' && (
            <GanttChart
              tasks={scheduleStages}
              projects={projects}
              users={auth.getUsers()}
              currentUserId={currentUser?.id}
              onSaveTask={handleSaveScheduleStage}
              onSaveTasksBatch={handleSaveScheduleStagesBatch}
              onDeleteTask={handleDeleteScheduleStage}
              onToggleTaskStatus={handleToggleScheduleStageStatus}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectsTab
              projects={projects}
              clients={clients}
              expenses={expenses}
              onSelectProject={(pId) => setSelectedProjectId(pId)}
              onSaveProject={handleSaveProject}
              onDeleteProject={handleDeleteProject}
              onOpenNewProject={() => {
                setNewProjectInitialClient(undefined);
                setIsNewProjectOpen(true);
              }}
            />
          )}

          {activeTab === 'crm' && (
            <CrmTab
              clients={clients}
              projects={projects}
              onSaveClient={handleSaveClient}
              onDeleteClient={handleDeleteClient}
              onSelectProject={(pId) => setSelectedProjectId(pId)}
              onOpenNewProjectWithClient={(clientId) => {
                setNewProjectInitialClient(clientId);
                setIsNewProjectOpen(true);
              }}
            />
          )}

          {activeTab === 'costs' && (
            <CostTrackingTab
              expenses={expenses}
              projects={projects}
              onSaveExpense={handleSaveExpense}
              onDeleteExpense={handleDeleteExpense}
              onOpenNewExpense={(pId) => {
                setNewExpenseInitialProject(pId);
                setIsNewExpenseOpen(true);
              }}
            />
          )}

          {activeTab === 'invoices' && (
            <InvoicesTab
              invoices={invoices}
              projects={projects}
              clients={clients}
              settings={settings}
              onSaveInvoice={handleSaveInvoice}
              onDeleteInvoice={handleDeleteInvoice}
              onOpenNewInvoice={(pId) => {
                setNewInvoiceInitialProject(pId);
                setIsNewInvoiceOpen(true);
              }}
            />
          )}

          {activeTab === 'supplier_invoices' && (
            <SupplierInvoicesTab
              supplierInvoices={supplierInvoices}
              projects={projects}
              settings={settings}
              onSaveSupplierInvoice={handleSaveSupplierInvoice}
              onDeleteSupplierInvoice={handleDeleteSupplierInvoice}
              onMarkPaid={handleMarkSupplierInvoicePaid}
              onMarkUnpaid={handleMarkSupplierInvoiceUnpaid}
              onPushToExpenses={handlePushSupplierInvoiceToExpenses}
              onOpenNewInvoice={() => {
                setSupplierInvoiceForEdit(undefined);
                setIsSupplierInvoiceModalOpen(true);
              }}
              onEditInvoice={(inv) => {
                setSupplierInvoiceForEdit(inv);
                setIsSupplierInvoiceModalOpen(true);
              }}
              onRefresh={async () => {
                const ok = await storage.fetchAllFromCloud();
                loadAllData();
                showToast({
                  title: ok ? '📬 Почта проверена' : 'Облако недоступно',
                  message: ok
                    ? 'Список фактур на уплату обновлен из облака.'
                    : 'Не удалось связаться с облачной базой. Проверьте интернет.',
                  type: 'sync',
                  duration: 4000,
                });
              }}
            />
          )}

          {activeTab === 'workers' && (
            <WorkersTab
              workers={workers}
              workLogs={workLogs}
              projects={projects}
              onSaveWorker={handleSaveWorker}
              onDeleteWorker={handleDeleteWorker}
              onSaveWorkLog={handleSaveWorkLog}
              onDeleteWorkLog={handleDeleteWorkLog}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              settings={settings}
              onSaveSettings={handleSaveSettings}
              onReloadAllData={loadAllData}
            />
          )}
        </main>
      </div>

      {/* MODAL 1: Project Details View */}
      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          client={selectedProjectClient}
          budgets={budgets}
          expenses={expenses}
          invoices={invoices}
          workers={workers}
          workLogs={workLogs}
          tasks={tasks}
          settings={settings}
          onClose={() => setSelectedProjectId(null)}
          onUpdateProject={handleSaveProject}
          onUpdateClient={handleSaveClient}
          onSaveTask={handleSaveTask}
          onSaveTasksBatch={handleSaveTasksBatch}
          onDeleteTask={handleDeleteTask}
          onToggleTaskStatus={handleToggleTaskStatus}
          onOpenBudgetEstimator={(bgt) => {
            setActiveBudgetForEdit(bgt);
            setIsBudgetEstimatorOpen(true);
          }}
          onOpenNewExpense={(pId) => {
            setNewExpenseInitialProject(pId);
            setIsNewExpenseOpen(true);
          }}
          onOpenNewInvoice={(pId) => {
            setNewInvoiceInitialProject(pId);
            setIsNewInvoiceOpen(true);
          }}
        />
      )}

      {/* MODAL 2: Budget Estimator (Výkaz výmer) */}
      {isBudgetEstimatorOpen && (
        <BudgetEstimatorModal
          budget={activeBudgetForEdit}
          projects={projects}
          clients={clients}
          settings={settings}
          onClose={() => {
            setIsBudgetEstimatorOpen(false);
            setActiveBudgetForEdit(undefined);
          }}
          onSaveBudget={handleSaveBudget}
        />
      )}

      {/* MODAL 3: New Project */}
      {isNewProjectOpen && (
        <NewProjectModal
          clients={clients}
          initialClientId={newProjectInitialClient}
          onClose={() => setIsNewProjectOpen(false)}
          onSave={handleSaveProject}
        />
      )}

      {/* MODAL 4: New Expense */}
      {isNewExpenseOpen && (
        <NewExpenseModal
          projects={projects}
          initialProjectId={newExpenseInitialProject}
          onClose={() => setIsNewExpenseOpen(false)}
          onSave={handleSaveExpense}
        />
      )}

      {/* MODAL 5: New Invoice */}
      {isNewInvoiceOpen && (
        <NewInvoiceModal
          projects={projects}
          clients={clients}
          settings={settings}
          initialProjectId={newInvoiceInitialProject}
          onClose={() => setIsNewInvoiceOpen(false)}
          onSave={handleSaveInvoice}
        />
      )}

      {/* MODAL 5b: Фактура на уплату (входящая от поставщика) */}
      {isSupplierInvoiceModalOpen && (
        <SupplierInvoiceModal
          invoice={supplierInvoiceForEdit}
          projects={projects}
          onClose={() => {
            setIsSupplierInvoiceModalOpen(false);
            setSupplierInvoiceForEdit(undefined);
          }}
          onSave={handleSaveSupplierInvoice}
        />
      )}

      {/* MODAL 6: New Task */}
      {isNewTaskModalOpen && (
        <TaskModal
          projects={projects}
          users={auth.getUsers()}
          currentUserId={currentUser?.id}
          onClose={() => setIsNewTaskModalOpen(false)}
          onSave={(task) => {
            handleSaveTask(task);
            setIsNewTaskModalOpen(false);
          }}
          onDelete={(id) => {
            handleDeleteTask(id);
            setIsNewTaskModalOpen(false);
          }}
        />
      )}

      {/* MODAL 7: Team Report Modal */}
      {isTeamReportOpen && (
        <TeamReportModal
          onClose={() => setIsTeamReportOpen(false)}
          projects={projects}
          clients={clients}
          expenses={expenses}
          invoices={invoices}
          tasks={tasks}
          workers={workers}
          workLogs={workLogs}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
