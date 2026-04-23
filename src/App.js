import { useState, useEffect, useMemo } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc } from "firebase/firestore";
import { LayoutDashboard, ListTodo, Users, Plus, Search, X, Mail, Trash2, ChevronDown, AlertCircle, CheckCircle2, Clock, PauseCircle, Circle, TrendingUp, Zap } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const firebaseConfig = {
  apiKey: "AIzaSyA6zno8skVW70ZcxD4qB73Ap36KhZgy2Jg",
  authDomain: "fudgytrack.firebaseapp.com",
  projectId: "fudgytrack",
  storageBucket: "fudgytrack.firebasestorage.app",
  messagingSenderId: "561232371431",
  appId: "1:561232371431:web:082bb4df4258423f140c42",
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

const DIVISIONS = {
  Finance: { members: ['Dhika', 'Ilham', 'Yafi', 'Hikmah'], color: '#0EA5E9', icon: '💰' },
  Operasional: { members: ['Tito', 'Ivana', 'Ian', 'Dhanny'], color: '#10B981', icon: '⚙️' },
  Purchasing: { members: ['Fredy'], color: '#F59E0B', icon: '🛒' },
  Marketing: { members: ['Ghina', 'Nasywa', 'Nabila'], color: '#EC4899', icon: '📢' },
  HR: { members: ['Musfita'], color: '#8B5CF6', icon: '👥' },
};

const ALL_MEMBERS = Object.entries(DIVISIONS).flatMap(([div, { members }]) =>
  members.map(name => ({ name, division: div, email: `${name.toLowerCase()}@company.com` }))
);

const PRIORITY_CONFIG = {
  Urgent: { color: '#EF4444', bg: '#FEE2E2' },
  High: { color: '#F97316', bg: '#FFEDD5' },
  Medium: { color: '#EAB308', bg: '#FEF3C7' },
  Low: { color: '#64748B', bg: '#F1F5F9' },
};

const STATUS_CONFIG = {
  'To Do': { color: '#64748B', bg: '#F1F5F9', icon: Circle },
  'In Progress': { color: '#3B82F6', bg: '#DBEAFE', icon: Clock },
  'Review': { color: '#F59E0B', bg: '#FEF3C7', icon: AlertCircle },
  'Done': { color: '#10B981', bg: '#D1FAE5', icon: CheckCircle2 },
  'Blocked': { color: '#EF4444', bg: '#FEE2E2', icon: PauseCircle },
};

const PROJECTS = ['Website Redesign', 'Mobile App', 'Marketing Campaign', 'CRM Integration', 'Product Launch', 'Internal Tools', 'Financial Audit', 'Recruitment'];

const seedTasks = () => {
  const addDays = (n) => { const x = new Date(); x.setDate(x.getDate() + n); return x.toISOString().split('T')[0]; };
  return [
    { id: 'TSK-001', name: 'Laporan keuangan Q1 2026', description: 'Susun laporan keuangan lengkap untuk kuartal pertama', assignees: ['Dhika', 'Ilham'], project: 'Financial Audit', priority: 'Urgent', status: 'In Progress', progress: 65, startDate: addDays(-10), deadline: addDays(3) },
    { id: 'TSK-002', name: 'Rekonsiliasi bank', description: 'Cek dan rekonsiliasi semua transaksi bank bulan Maret', assignees: ['Yafi', 'Hikmah'], project: 'Financial Audit', priority: 'High', status: 'Review', progress: 90, startDate: addDays(-15), deadline: addDays(2) },
    { id: 'TSK-003', name: 'SOP gudang baru', description: 'Drafting SOP operasional gudang cabang Surabaya', assignees: ['Tito', 'Ivana'], project: 'Internal Tools', priority: 'Medium', status: 'In Progress', progress: 40, startDate: addDays(-5), deadline: addDays(10) },
    { id: 'TSK-004', name: 'Quality check batch April', description: 'QC untuk batch produk April sebelum shipping', assignees: ['Ian', 'Dhanny'], project: 'Product Launch', priority: 'High', status: 'To Do', progress: 0, startDate: addDays(1), deadline: addDays(14) },
    { id: 'TSK-005', name: 'Negosiasi vendor packaging', description: 'Cari harga terbaik untuk packaging baru', assignees: ['Fredy'], project: 'Product Launch', priority: 'High', status: 'In Progress', progress: 55, startDate: addDays(-7), deadline: addDays(5) },
    { id: 'TSK-006', name: 'Kampanye Instagram Ramadhan', description: 'Konsep dan eksekusi campaign Ramadhan di IG', assignees: ['Ghina', 'Nasywa', 'Nabila'], project: 'Marketing Campaign', priority: 'Urgent', status: 'In Progress', progress: 75, startDate: addDays(-12), deadline: addDays(1) },
    { id: 'TSK-007', name: 'Content plan April', description: 'Susun content calendar untuk bulan April', assignees: ['Ghina', 'Nabila'], project: 'Marketing Campaign', priority: 'Medium', status: 'Done', progress: 100, startDate: addDays(-20), deadline: addDays(-3) },
    { id: 'TSK-008', name: 'Rekrut 3 developer', description: 'Proses hiring untuk posisi dev backend dan frontend', assignees: ['Musfita'], project: 'Recruitment', priority: 'High', status: 'In Progress', progress: 30, startDate: addDays(-8), deadline: addDays(21) },
    { id: 'TSK-009', name: 'Onboarding karyawan baru', description: 'Siapkan materi & jadwal onboarding 2 orang baru', assignees: ['Musfita'], project: 'Internal Tools', priority: 'Medium', status: 'To Do', progress: 0, startDate: addDays(2), deadline: addDays(9) },
    { id: 'TSK-010', name: 'Integrasi CRM dengan WhatsApp', description: 'Setup integrasi WA Business API ke CRM', assignees: ['Tito', 'Dhanny'], project: 'CRM Integration', priority: 'High', status: 'Blocked', progress: 45, startDate: addDays(-14), deadline: addDays(7) },
  ];
};

const formatDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
const daysUntil = (d) => Math.ceil((new Date(d) - new Date().setHours(0,0,0,0)) / 86400000);

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status]; const Icon = cfg.icon;
  return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium" style={{ color: cfg.color, backgroundColor: cfg.bg }}><Icon size={12} strokeWidth={2.5} />{status}</span>;
};

const PriorityBadge = ({ priority }) => {
  const cfg = PRIORITY_CONFIG[priority];
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold" style={{ color: cfg.color, backgroundColor: cfg.bg }}>{priority === 'Urgent' && '🔥'} {priority}</span>;
};

const AssigneeAvatars = ({ assignees, max = 3 }) => {
  const visible = assignees.slice(0, max); const extra = assignees.length - max;
  return (
    <div className="flex -space-x-2">
      {visible.map(name => {
        const m = ALL_MEMBERS.find(x => x.name === name);
        const color = m ? DIVISIONS[m.division].color : '#64748B';
        return <div key={name} title={name} className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow-sm" style={{ backgroundColor: color }}>{name[0]}</div>;
      })}
      {extra > 0 && <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold border-2 border-white">+{extra}</div>}
    </div>
  );
};

const TaskModal = ({ task, onClose, onSave, onDelete }) => {
  const [form, setForm] = useState(task || {
    id: `TSK-${Date.now().toString().slice(-6)}`, name: '', description: '',
    assignees: [], project: PROJECTS[0], priority: 'Medium', status: 'To Do', progress: 0,
    startDate: new Date().toISOString().split('T')[0],
    deadline: new Date(Date.now() + 7*86400000).toISOString().split('T')[0],
  });
  const [assigneeOpen, setAssigneeOpen] = useState(false);

  const toggleAssignee = name => setForm(f => ({ ...f, assignees: f.assignees.includes(name) ? f.assignees.filter(n => n !== name) : [...f.assignees, name] }));

  const handleSubmit = () => {
    if (!form.name.trim()) { alert('Nama tugas wajib diisi'); return; }
    if (!form.assignees.length) { alert('Pilih minimal 1 assignee'); return; }
    onSave(form);
  };

  const sendEmail = () => {
    const to = form.assignees.map(n => ALL_MEMBERS.find(m => m.name === n)?.email).filter(Boolean).join(',');
    const sub = encodeURIComponent(`[Task] ${form.name}`);
    const body = encodeURIComponent(`Halo,\n\nKamu di-assign ke tugas:\n\nID: ${form.id}\nNama: ${form.name}\nProject: ${form.project}\nPrioritas: ${form.priority}\nDeadline: ${formatDate(form.deadline)}\n\nTerima kasih.`);
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${sub}&body=${body}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div><h2 className="text-lg font-bold text-slate-900">{task ? 'Edit Tugas' : 'Tugas Baru'}</h2><p className="text-xs text-slate-500 font-mono">{form.id}</p></div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Nama Tugas</label>
            <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="Nama tugas..." />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Deskripsi</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" rows={2} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Assignee</label>
            <button onClick={() => setAssigneeOpen(!assigneeOpen)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-left text-sm flex items-center justify-between hover:bg-slate-50">
              <span className={form.assignees.length ? 'text-slate-900' : 'text-slate-400'}>{form.assignees.length ? `${form.assignees.length} dipilih` : 'Pilih assignee...'}</span>
              <ChevronDown size={16} className={`transition-transform ${assigneeOpen ? 'rotate-180' : ''}`} />
            </button>
            {form.assignees.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.assignees.map(name => {
                  const m = ALL_MEMBERS.find(x => x.name === name);
                  return <span key={name} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-white" style={{ backgroundColor: DIVISIONS[m.division].color }}>{name}<button onClick={() => toggleAssignee(name)}><X size={11} /></button></span>;
                })}
              </div>
            )}
            {assigneeOpen && (
              <div className="mt-2 border border-slate-200 rounded-lg max-h-48 overflow-y-auto bg-white">
                {Object.entries(DIVISIONS).map(([div, { members, color, icon }]) => (
                  <div key={div}>
                    <div className="px-3 py-1.5 bg-slate-50 text-xs font-bold text-slate-600 uppercase tracking-wide sticky top-0">{icon} {div}</div>
                    {members.map(name => (
                      <label key={name} className="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 cursor-pointer border-t border-slate-100">
                        <input type="checkbox" checked={form.assignees.includes(name)} onChange={() => toggleAssignee(name)} className="accent-orange-500" />
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: color }}>{name[0]}</div>
                        <span className="text-sm">{name}</span>
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            )}
            {form.assignees.length > 0 && (
              <button onClick={sendEmail} className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium">
                <Mail size={13} /> Kirim notifikasi Gmail ({form.assignees.length} orang)
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Project</label>
              <select value={form.project} onChange={e => setForm({...form, project: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">{PROJECTS.map(p => <option key={p}>{p}</option>)}</select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Prioritas</label>
              <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">{Object.keys(PRIORITY_CONFIG).map(p => <option key={p}>{p}</option>)}</select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Status</label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">{Object.keys(STATUS_CONFIG).map(s => <option key={s}>{s}</option>)}</select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Progress: {form.progress}%</label>
              <input type="range" min="0" max="100" step="5" value={form.progress} onChange={e => setForm({...form, progress: +e.target.value})} className="w-full mt-2 accent-orange-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Tanggal Mulai</label>
              <input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Deadline</label>
              <input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
          <div>{task && onDelete && <button onClick={() => { if (window.confirm('Hapus tugas ini?')) onDelete(task.id); }} className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium inline-flex items-center gap-1.5"><Trash2 size={14} /> Hapus</button>}</div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-lg text-sm font-medium">Batal</button>
            <button onClick={handleSubmit} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold">{task ? 'Simpan' : 'Buat Tugas'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fbStatus, setFbStatus] = useState('connecting');
  const [view, setView] = useState('dashboard');
  const [modalTask, setModalTask] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filters, setFilters] = useState({ search: '', division: 'All', status: 'All', priority: 'All' });

  useEffect(() => {
    const ref = collection(db, 'tasks');
    const unsub = onSnapshot(ref, async (snap) => {
      if (snap.empty) {
        const seed = seedTasks();
        for (const t of seed) await setDoc(doc(db, 'tasks', t.id), t);
        setFbStatus('connected');
      } else {
        setTasks(snap.docs.map(d => d.data()));
        setFbStatus('connected');
      }
      setLoading(false);
    }, (err) => {
      console.error(err);
      setFbStatus('error');
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const saveTask = async (task) => {
    await setDoc(doc(db, 'tasks', task.id), task);
    setModalOpen(false); setModalTask(null);
  };

  const deleteTask = async (id) => {
    await deleteDoc(doc(db, 'tasks', id));
    setModalOpen(false); setModalTask(null);
  };

  const filtered = useMemo(() => tasks.filter(t => {
    if (filters.search && !t.name.toLowerCase().includes(filters.search.toLowerCase()) && !t.id.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.division !== 'All' && !t.assignees.some(a => DIVISIONS[filters.division].members.includes(a))) return false;
    if (filters.status !== 'All' && t.status !== filters.status) return false;
    if (filters.priority !== 'All' && t.priority !== filters.priority) return false;
    return true;
  }), [tasks, filters]);

  const stats = useMemo(() => {
    const total = tasks.length, done = tasks.filter(t => t.status === 'Done').length;
    const inProgress = tasks.filter(t => t.status === 'In Progress').length;
    const overdue = tasks.filter(t => t.status !== 'Done' && daysUntil(t.deadline) < 0).length;
    const urgent = tasks.filter(t => t.priority === 'Urgent' && t.status !== 'Done').length;
    const blocked = tasks.filter(t => t.status === 'Blocked').length;
    const completionRate = total ? Math.round((done / total) * 100) : 0;
    const byStatus = Object.keys(STATUS_CONFIG).map(s => ({ name: s, value: tasks.filter(t => t.status === s).length, color: STATUS_CONFIG[s].color }));
    const byDivision = Object.entries(DIVISIONS).map(([name, { members, color }]) => {
      const dt = tasks.filter(t => t.assignees.some(a => members.includes(a)));
      return { name, color, total: dt.length, done: dt.filter(t => t.status === 'Done').length, active: dt.filter(t => t.status !== 'Done').length };
    });
    return { total, done, inProgress, overdue, urgent, blocked, completionRate, byStatus, byDivision };
  }, [tasks]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
      <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-600 rounded-xl flex items-center justify-center font-bold text-white text-lg animate-pulse">F</div>
      <p className="text-slate-500 text-sm">Menghubungkan ke Firebase...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex" style={{ fontFamily: "system-ui, sans-serif" }}>
      <aside className="w-60 bg-slate-900 text-slate-200 flex flex-col min-h-screen sticky top-0">
        <div className="px-5 py-5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-pink-600 rounded-lg flex items-center justify-center font-bold text-white">F</div>
            <div>
              <h1 className="font-bold text-white text-sm">FudgyTrack</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full ${fbStatus === 'connected' ? 'bg-emerald-400' : fbStatus === 'error' ? 'bg-red-400' : 'bg-yellow-400'}`} />
                <p className="text-[10px] text-slate-500">{fbStatus === 'connected' ? 'Firebase Connected' : fbStatus === 'error' ? 'Error' : 'Connecting...'}</p>
              </div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {[{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }, { id: 'tasks', label: 'Semua Tugas', icon: ListTodo }, { id: 'team', label: 'Tim & Divisi', icon: Users }].map(item => {
            const Icon = item.icon; const active = view === item.id;
            return <button key={item.id} onClick={() => setView(item.id)} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-orange-500 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Icon size={16} />{item.label}</button>;
          })}
        </nav>
        <div className="p-3 border-t border-slate-800">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 px-3">Divisi</div>
          {Object.entries(DIVISIONS).map(([name, { icon }]) => (
            <button key={name} onClick={() => { setView('tasks'); setFilters(f => ({...f, division: name})); }}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs text-slate-400 hover:bg-slate-800 hover:text-white">
              <span>{icon}</span><span className="flex-1 text-left">{name}</span>
              <span className="text-[10px] opacity-60">{DIVISIONS[name].members.length}</span>
            </button>
          ))}
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{view === 'dashboard' ? 'Dashboard' : view === 'tasks' ? 'Semua Tugas' : 'Tim & Divisi'}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{view === 'dashboard' ? `${stats.total} tugas · ${stats.completionRate}% selesai` : view === 'tasks' ? `${filtered.length} dari ${tasks.length} tugas` : `${ALL_MEMBERS.length} anggota`}</p>
          </div>
          <button onClick={() => { setModalTask(null); setModalOpen(true); }} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5">
            <Plus size={16} /> Tugas Baru
          </button>
        </header>

        <div className="p-6">
          {view === 'dashboard' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Total Tugas', value: stats.total, icon: ListTodo, c: 'text-slate-700 bg-slate-100' },
                  { label: 'Selesai', value: stats.done, icon: CheckCircle2, c: 'text-emerald-700 bg-emerald-100' },
                  { label: 'In Progress', value: stats.inProgress, icon: Clock, c: 'text-blue-700 bg-blue-100' },
                  { label: 'Overdue', value: stats.overdue, icon: AlertCircle, c: 'text-red-700 bg-red-100' },
                  { label: 'Completion', value: `${stats.completionRate}%`, icon: TrendingUp, c: 'text-emerald-700 bg-emerald-100' },
                  { label: 'Urgent Aktif', value: stats.urgent, icon: Zap, c: 'text-orange-700 bg-orange-100' },
                  { label: 'Blocked', value: stats.blocked, icon: PauseCircle, c: 'text-red-700 bg-red-100' },
                  { label: 'Anggota', value: ALL_MEMBERS.length, icon: Users, c: 'text-purple-700 bg-purple-100' },
                ].map(k => { const Icon = k.icon; return (
                  <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between">
                      <div><div className="text-xs font-medium text-slate-500 uppercase tracking-wide">{k.label}</div><div className="text-3xl font-bold text-slate-900 mt-1">{k.value}</div></div>
                      <div className={`p-2 rounded-lg ${k.c}`}><Icon size={16} /></div>
                    </div>
                  </div>
                ); })}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <h3 className="font-bold text-slate-900 mb-4">Status Distribution</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart><Pie data={stats.byStatus.filter(d => d.value > 0)} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2}>
                      {stats.byStatus.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie><Tooltip /><Legend wrapperStyle={{ fontSize: '12px' }} /></PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <h3 className="font-bold text-slate-900 mb-4">Tugas per Divisi</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={stats.byDivision}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="done" stackId="a" fill="#10B981" name="Done" />
                      <Bar dataKey="active" stackId="a" fill="#F97316" name="Active" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {stats.byDivision.map(d => {
                  const cfg = DIVISIONS[d.name]; const pct = d.total ? Math.round((d.done/d.total)*100) : 0;
                  return (
                    <button key={d.name} onClick={() => { setView('tasks'); setFilters(f => ({...f, division: d.name})); }}
                      className="bg-white rounded-xl border border-slate-200 p-4 text-left hover:shadow-md transition">
                      <div className="text-xl mb-2">{cfg.icon}</div>
                      <div className="font-bold text-sm text-slate-900 mb-1">{d.name}</div>
                      <div className="text-2xl font-bold text-slate-900 mb-2">{d.total}<span className="text-xs text-slate-500 font-normal ml-1">tugas</span></div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: d.color }} />
                      </div>
                      <div className="text-xs text-slate-500 flex justify-between"><span>{cfg.members.length} anggota</span><span className="font-bold text-slate-700">{pct}%</span></div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {view === 'tasks' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} placeholder="Cari tugas..." className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
                {[['division', Object.keys(DIVISIONS)], ['status', Object.keys(STATUS_CONFIG)], ['priority', Object.keys(PRIORITY_CONFIG)]].map(([key, opts]) => (
                  <select key={key} value={filters[key]} onChange={e => setFilters({...filters, [key]: e.target.value})} className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                    <option value="All">Semua {key}</option>
                    {opts.map(o => <option key={o}>{o}</option>)}
                  </select>
                ))}
                {(filters.search || filters.division !== 'All' || filters.status !== 'All' || filters.priority !== 'All') && (
                  <button onClick={() => setFilters({ search: '', division: 'All', status: 'All', priority: 'All' })} className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg inline-flex items-center gap-1"><X size={14} /> Reset</button>
                )}
              </div>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr className="bg-slate-50 border-b border-slate-200">
                      {['ID', 'Tugas', 'Assignee', 'Project', 'Priority', 'Status', 'Progress', 'Deadline'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-slate-600 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr><td colSpan={8} className="text-center py-12 text-slate-400 text-sm">Tidak ada tugas.</td></tr>
                      ) : filtered.map(t => {
                        const days = daysUntil(t.deadline);
                        const overdue = days < 0 && t.status !== 'Done';
                        const soon = days >= 0 && days <= 3 && t.status !== 'Done';
                        return (
                          <tr key={t.id} onClick={() => { setModalTask(t); setModalOpen(true); }} className="border-b border-slate-100 hover:bg-orange-50 cursor-pointer transition-colors">
                            <td className="px-4 py-3 text-xs font-mono text-slate-500">{t.id}</td>
                            <td className="px-4 py-3"><div className="font-semibold text-slate-900 text-sm">{t.name}</div><div className="text-xs text-slate-500 line-clamp-1">{t.description}</div></td>
                            <td className="px-4 py-3"><AssigneeAvatars assignees={t.assignees} /></td>
                            <td className="px-4 py-3 text-xs text-slate-700">{t.project}</td>
                            <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                            <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2 w-28">
                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full" style={{ width: `${t.progress}%`, backgroundColor: t.progress === 100 ? '#10B981' : '#F97316' }} />
                                </div>
                                <span className="text-xs font-semibold text-slate-700 w-8">{t.progress}%</span>
                              </div>
                            </td>
                            <td className={`px-4 py-3 text-xs font-medium ${overdue ? 'text-red-600' : soon ? 'text-orange-600' : 'text-slate-700'}`}>
                              {formatDate(t.deadline)}
                              {overdue && <div className="text-[10px] font-bold">Terlambat {Math.abs(days)}h</div>}
                              {soon && !overdue && <div className="text-[10px] font-bold">{days === 0 ? 'Hari ini!' : `H-${days}`}</div>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {view === 'team' && (
            <div className="space-y-4 max-w-[1200px]">
              {Object.entries(DIVISIONS).map(([name, { members, color, icon }]) => {
                const divTasks = tasks.filter(t => t.assignees.some(a => members.includes(a)));
                return (
                  <div key={name} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3" style={{ backgroundColor: `${color}08` }}>
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ backgroundColor: `${color}20` }}>{icon}</div>
                      <div className="flex-1"><h3 className="font-bold text-slate-900">{name}</h3><p className="text-xs text-slate-500">{members.length} anggota · {divTasks.length} tugas</p></div>
                      <button onClick={() => { setView('tasks'); setFilters(f => ({...f, division: name})); }} className="text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-white transition" style={{ color }}>Lihat tugas →</button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
                      {members.map(member => {
                        const mt = tasks.filter(t => t.assignees.includes(member));
                        return (
                          <div key={member} className="p-4 border-r border-b border-slate-100 last:border-r-0">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: color }}>{member[0]}</div>
                              <div><div className="font-semibold text-slate-900 text-sm">{member}</div><div className="text-[10px] text-slate-500">{member.toLowerCase()}@company.com</div></div>
                            </div>
                            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                              <span className="text-slate-500">Tugas: <span className="font-bold text-slate-900">{mt.length}</span></span>
                              <span className="text-emerald-600 font-semibold">{mt.filter(t => t.status === 'Done').length} done</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {modalOpen && <TaskModal task={modalTask} onClose={() => { setModalOpen(false); setModalTask(null); }} onSave={saveTask} onDelete={modalTask ? deleteTask : null} />}
    </div>
  );
}
