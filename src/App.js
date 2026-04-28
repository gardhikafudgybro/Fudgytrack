import { useState, useEffect, useMemo } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc } from "firebase/firestore";
import { LayoutDashboard, ListTodo, Users, Plus, Search, X, Mail, Trash2, ChevronDown, AlertCircle, CheckCircle2, Clock, PauseCircle, Circle, TrendingUp, Zap, Settings, Edit2, UserPlus, Lock, PlusCircle, LogOut } from "lucide-react";
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

const SETTINGS_PASSWORD = "fudgybro2026";
const APP_URL = "https://fudgytrack.vercel.app";

const DIVISION_PREFIX = {
  Manajemen: 'MGT', Finance: 'FIN', Operasional: 'OPS',
  Purchasing: 'PUR', Marketing: 'MKT', HR: 'HR',
};

const DEFAULT_DIVISIONS = {
  Manajemen: { members: [{ name: 'Owner', email: 'gardhikafudgybro@gmail.com' }], color: '#6366F1', icon: '👑' },
  Finance: { members: [
    { name: 'Dhika', email: 'gardhikafudgybro@gmail.com' },
    { name: 'Ilham', email: 'ilhamhaqiqi21@gmail.com' },
    { name: 'Yafi', email: 'yafialjafier18@gmail.com' },
    { name: 'Hikmah', email: 'hikmahtul74@gmail.com' },
  ], color: '#0EA5E9', icon: '💰' },
  Operasional: { members: [
    { name: 'Tito', email: 'titobagussetiawan.fudgybro@gmail.com' },
    { name: 'Ivana', email: 'ivana.fudgybro@gmail.com' },
    { name: 'Ian', email: 'zackydimas5@gmail.com' },
    { name: 'Dhanny', email: 'daydanny07@gmail.com' },
  ], color: '#10B981', icon: '⚙️' },
  Purchasing: { members: [{ name: 'Fredy', email: 'prakosof26@gmail.com' }], color: '#F59E0B', icon: '🛒' },
  Marketing: { members: [
    { name: 'Ghina', email: 'ghina.fudgybro@gmail.com' },
    { name: 'Nasywa', email: 'nasywa.widyaputri@gmail.com' },
    { name: 'Nabila', email: 'nabillazzahrahmat@gmail.com' },
  ], color: '#EC4899', icon: '📢' },
  HR: { members: [{ name: 'Musfita', email: 'muspitarohmi@gmail.com' }], color: '#8B5CF6', icon: '👥' },
};

// Build credential map: email → { name, password }
const buildCredentials = (divisions) => {
  const creds = {};
  Object.values(divisions).forEach(({ members }) => {
    members.forEach(m => {
      creds[m.email.toLowerCase()] = {
        name: m.name,
        password: `${m.name.toLowerCase()}123`,
      };
    });
  });
  return creds;
};

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

const generateId = (divisions, assignees) => {
  if (!assignees || !assignees.length) return `TSK-${Date.now().toString().slice(-6)}`;
  const div = Object.entries(divisions).find(([, { members }]) => members.some(m => m.name === assignees[0]))?.[0];
  return `${div ? (DIVISION_PREFIX[div] || 'TSK') : 'TSK'}-${Date.now().toString().slice(-6)}`;
};

const seedTasks = () => {
  const addDays = (n) => { const x = new Date(); x.setDate(x.getDate() + n); return x.toISOString().split('T')[0]; };
  return [
    { id: 'FIN-001', name: 'Laporan keuangan Q1 2026', description: 'Susun laporan keuangan lengkap untuk kuartal pertama', assignees: ['Dhika', 'Ilham'], project: 'Financial Audit', priority: 'Urgent', status: 'In Progress', progress: 65, driveUrl: '', startDate: addDays(-10), deadline: addDays(3), updates: [] },
    { id: 'FIN-002', name: 'Rekonsiliasi bank', description: 'Cek dan rekonsiliasi semua transaksi bank bulan Maret', assignees: ['Yafi', 'Hikmah'], project: 'Financial Audit', priority: 'High', status: 'Review', progress: 90, driveUrl: '', startDate: addDays(-15), deadline: addDays(2), updates: [] },
    { id: 'OPS-001', name: 'SOP gudang baru', description: 'Drafting SOP operasional gudang cabang Surabaya', assignees: ['Tito', 'Ivana'], project: 'Internal Tools', priority: 'Medium', status: 'In Progress', progress: 40, driveUrl: '', startDate: addDays(-5), deadline: addDays(10), updates: [] },
    { id: 'OPS-002', name: 'Quality check batch April', description: 'QC untuk batch produk April sebelum shipping', assignees: ['Ian', 'Dhanny'], project: 'Product Launch', priority: 'High', status: 'To Do', progress: 0, driveUrl: '', startDate: addDays(1), deadline: addDays(14), updates: [] },
    { id: 'PUR-001', name: 'Negosiasi vendor packaging', description: 'Cari harga terbaik untuk packaging baru', assignees: ['Fredy'], project: 'Product Launch', priority: 'High', status: 'In Progress', progress: 55, driveUrl: '', startDate: addDays(-7), deadline: addDays(5), updates: [] },
    { id: 'MKT-001', name: 'Kampanye Instagram Ramadhan', description: 'Konsep dan eksekusi campaign Ramadhan di IG', assignees: ['Ghina', 'Nasywa', 'Nabila'], project: 'Marketing Campaign', priority: 'Urgent', status: 'In Progress', progress: 75, driveUrl: '', startDate: addDays(-12), deadline: addDays(1), updates: [] },
    { id: 'MKT-002', name: 'Content plan April', description: 'Susun content calendar untuk bulan April', assignees: ['Ghina', 'Nabila'], project: 'Marketing Campaign', priority: 'Medium', status: 'Done', progress: 100, driveUrl: '', startDate: addDays(-20), deadline: addDays(-3), updates: [] },
    { id: 'HR-001', name: 'Rekrut 3 developer', description: 'Proses hiring untuk posisi dev backend dan frontend', assignees: ['Musfita'], project: 'Recruitment', priority: 'High', status: 'In Progress', progress: 30, driveUrl: '', startDate: addDays(-8), deadline: addDays(21), updates: [] },
    { id: 'HR-002', name: 'Onboarding karyawan baru', description: 'Siapkan materi & jadwal onboarding 2 orang baru', assignees: ['Musfita'], project: 'Internal Tools', priority: 'Medium', status: 'To Do', progress: 0, driveUrl: '', startDate: addDays(2), deadline: addDays(9), updates: [] },
    { id: 'OPS-003', name: 'Integrasi CRM dengan WhatsApp', description: 'Setup integrasi WA Business API ke CRM', assignees: ['Tito', 'Dhanny'], project: 'CRM Integration', priority: 'High', status: 'Blocked', progress: 45, driveUrl: '', startDate: addDays(-14), deadline: addDays(7), updates: [] },
  ];
};

const formatDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
const daysUntil = (d) => Math.ceil((new Date(d) - new Date().setHours(0,0,0,0)) / 86400000);
const todayStr = () => new Date().toISOString().split('T')[0];

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status]; const Icon = cfg.icon;
  return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium" style={{ color: cfg.color, backgroundColor: cfg.bg }}><Icon size={12} strokeWidth={2.5} />{status}</span>;
};

const PriorityBadge = ({ priority }) => {
  const cfg = PRIORITY_CONFIG[priority];
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold" style={{ color: cfg.color, backgroundColor: cfg.bg }}>{priority === 'Urgent' && '🔥'} {priority}</span>;
};

const AssigneeAvatars = ({ assignees, divisions, max = 3 }) => {
  const allM = Object.values(divisions).flatMap(({ members, color }) => members.map(m => ({ ...m, color })));
  const visible = assignees.slice(0, max); const extra = assignees.length - max;
  return (
    <div className="flex -space-x-2">
      {visible.map(name => { const m = allM.find(x => x.name === name); return <div key={name} title={name} className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow-sm" style={{ backgroundColor: m?.color || '#64748B' }}>{name[0]}</div>; })}
      {extra > 0 && <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold border-2 border-white">+{extra}</div>}
    </div>
  );
};

// ─── Login Page ───────────────────────────────────────────────────────────────
const FUDGY_LOGO = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 60'%3E%3Crect width='100' height='60' rx='12' fill='%23f5e6d3'/%3E%3Cellipse cx='50' cy='35' rx='38' ry='16' fill='%23c9956a'/%3E%3Cellipse cx='50' cy='30' rx='38' ry='14' fill='%23e8c49a'/%3E%3Cellipse cx='50' cy='28' rx='34' ry='10' fill='%23d4a574'/%3E%3Ccircle cx='35' cy='28' r='3' fill='%23b8845a' opacity='0.6'/%3E%3Ccircle cx='50' cy='26' r='2.5' fill='%23b8845a' opacity='0.6'/%3E%3Ccircle cx='63' cy='29' r='2' fill='%23b8845a' opacity='0.6'/%3E%3Ccircle cx='42' cy='32' r='2' fill='%23b8845a' opacity='0.5'/%3E%3Ccircle cx='57' cy='31' r='2.5' fill='%23b8845a' opacity='0.5'/%3E%3C/svg%3E";

const BG_ICONS = ['💰','📢','👥','⚙️','🛒','📊','📋','✅','🎯','📈','🗂️','⏰','📌','🔔','💼'];

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);

  const handleLogin = () => {
    const creds = buildCredentials(DEFAULT_DIVISIONS);
    const match = creds[email.toLowerCase().trim()];
    if (!match) { setError('Email tidak terdaftar.'); return; }
    if (password !== match.password) { setError('Password salah.'); return; }
    onLogin({ name: match.name, email: email.toLowerCase().trim() });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ backgroundColor: '#f5ede0' }}>
      {/* Background icons grid */}
      <div className="absolute inset-0 pointer-events-none select-none" style={{ opacity: 0.13 }}>
        {Array.from({ length: 80 }).map((_, i) => (
          <span key={i} className="absolute text-2xl" style={{
            left: `${(i % 10) * 10 + 2}%`,
            top: `${Math.floor(i / 10) * 12 + 2}%`,
            color: '#a0522d',
            transform: `rotate(${(i * 17) % 30 - 15}deg)`,
          }}>{BG_ICONS[i % BG_ICONS.length]}</span>
        ))}
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Divisi icons */}
        <div className="flex justify-center gap-6 mb-6">
          {[['💰','FINANCE'],['📢','MARKETING'],['👥','HR'],['⚙️','OPERATION'],['🛒','PURCHASING']].map(([icon, label]) => (
            <div key={label} className="flex flex-col items-center gap-1 opacity-70">
              <span className="text-2xl">{icon}</span>
              <span className="text-[9px] font-bold tracking-wider" style={{ color: '#a0522d' }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Logo fudgybro */}
        <div className="text-center mb-6">
          <div className="w-20 h-12 mx-auto mb-3 rounded-2xl overflow-hidden shadow-lg">
            <img src={FUDGY_LOGO} alt="FudgyTrack" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#6b3a1f' }}>FudgyTrack</h1>
          <p className="text-sm mt-0.5" style={{ color: '#a0522d' }}>Team Task Management</p>
        </div>

        {/* Login card */}
        <div className="bg-white/90 backdrop-blur rounded-2xl shadow-2xl p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#6b3a1f' }}>Email</label>
            <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: '#d4a574', focusRingColor: '#c9956a' }}
              placeholder="email@gmail.com" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#6b3a1f' }}>Password</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 pr-24"
                style={{ borderColor: '#d4a574' }}
                placeholder="••••••••" />
              <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium" style={{ color: '#a0522d' }}>{showPw ? 'Sembunyikan' : 'Tampilkan'}</button>
            </div>
          </div>
          {error && <p className="text-xs text-red-500 font-medium bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <button onClick={handleLogin} className="w-full py-2.5 text-white rounded-lg text-sm font-semibold transition-colors"
            style={{ backgroundColor: '#c9956a' }}
            onMouseEnter={e => e.target.style.backgroundColor='#b8845a'}
            onMouseLeave={e => e.target.style.backgroundColor='#c9956a'}>
            Masuk
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Settings View ────────────────────────────────────────────────────────────
const SettingsView = ({ divisions, setDivisions }) => {
  const [editModal, setEditModal] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', division: Object.keys(divisions)[0] });

  const openEdit = (divKey, idx) => { const m = divisions[divKey].members[idx]; setForm({ name: m.name, email: m.email, division: divKey }); setEditModal({ divKey, idx }); };
  const openNew = () => { setForm({ name: '', email: '', division: Object.keys(divisions)[0] }); setEditModal('new'); };

  const saveEdit = () => {
    if (!form.name.trim() || !form.email.trim()) { alert('Nama dan email wajib diisi'); return; }
    const updated = JSON.parse(JSON.stringify(divisions));
    if (editModal === 'new') updated[form.division].members.push({ name: form.name, email: form.email });
    else {
      const { divKey, idx } = editModal;
      if (divKey !== form.division) { updated[divKey].members.splice(idx, 1); updated[form.division].members.push({ name: form.name, email: form.email }); }
      else updated[divKey].members[idx] = { name: form.name, email: form.email };
    }
    setDivisions(updated); setEditModal(null);
  };

  return (
    <div className="space-y-4 max-w-[900px]">
      <div className="flex items-center justify-between">
        <div><h3 className="font-bold text-slate-900">Data Karyawan</h3><p className="text-xs text-slate-500 mt-0.5">Edit nama, email, dan tambah karyawan baru</p></div>
        <button onClick={openNew} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5"><UserPlus size={15} /> Tambah Karyawan</button>
      </div>
      {Object.entries(divisions).map(([divKey, { members, color, icon }]) => (
        <div key={divKey} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2" style={{ backgroundColor: `${color}10` }}>
            <span className="text-lg">{icon}</span><span className="font-bold text-slate-900">{divKey}</span>
            <span className="text-xs text-slate-500 ml-1">· prefix: <span className="font-mono font-bold">{DIVISION_PREFIX[divKey]}</span></span>
            <span className="text-xs text-slate-400 ml-1">({members.length} orang)</span>
          </div>
          <table className="w-full">
            <thead><tr className="bg-slate-50 border-b border-slate-100"><th className="text-left px-4 py-2 text-[11px] font-bold text-slate-500 uppercase">Nama</th><th className="text-left px-4 py-2 text-[11px] font-bold text-slate-500 uppercase">Email</th><th className="text-left px-4 py-2 text-[11px] font-bold text-slate-500 uppercase">Password</th><th className="px-4 py-2 w-16"></th></tr></thead>
            <tbody>
              {members.map((m, idx) => (
                <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: color }}>{m.name[0]}</div><span className="text-sm font-semibold text-slate-900">{m.name}</span></div></td>
                  <td className="px-4 py-3 text-sm text-slate-600">{m.email}</td>
                  <td className="px-4 py-3 text-sm font-mono text-slate-400">{m.name.toLowerCase()}123</td>
                  <td className="px-4 py-3 text-right"><button onClick={() => openEdit(divKey, idx)} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500"><Edit2 size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      {editModal !== null && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200"><h2 className="font-bold text-slate-900">{editModal === 'new' ? 'Tambah Karyawan' : 'Edit Karyawan'}</h2><button onClick={() => setEditModal(null)} className="p-2 hover:bg-slate-100 rounded-lg"><X size={18} /></button></div>
            <div className="p-6 space-y-4">
              <div><label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">Nama</label><input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" /></div>
              <div><label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">Email</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" /></div>
              <div><label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">Divisi</label><select value={form.division} onChange={e => setForm({...form, division: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">{Object.entries(divisions).map(([k, { icon }]) => <option key={k} value={k}>{icon} {k}</option>)}</select></div>
              <div className="bg-slate-50 rounded-lg px-3 py-2 text-xs text-slate-500">🔑 Password otomatis: <span className="font-mono font-bold text-slate-700">{form.name ? `${form.name.toLowerCase()}123` : 'nama123'}</span></div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
              <button onClick={() => setEditModal(null)} className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-lg text-sm">Batal</button>
              <button onClick={saveEdit} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Task Modal ───────────────────────────────────────────────────────────────
const TaskModal = ({ task, onClose, onSave, onDelete, divisions, currentUser }) => {
  const allMembers = Object.entries(divisions).flatMap(([div, { members, color }]) => members.map(m => ({ ...m, division: div, color })));
  const [form, setForm] = useState(task ? { ...task, updates: task.updates || [] } : {
    id: '', name: '', description: '', driveUrl: '',
    assignees: [], project: '', priority: 'Medium', status: 'To Do', progress: 0,
    startDate: new Date().toISOString().split('T')[0],
    deadline: new Date(Date.now() + 7*86400000).toISOString().split('T')[0],
    updates: [],
  });
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [newUpdate, setNewUpdate] = useState({ date: todayStr(), note: '', by: currentUser?.name || '' });

  const toggleAssignee = name => setForm(f => {
    const newA = f.assignees.includes(name) ? f.assignees.filter(n => n !== name) : [...f.assignees, name];
    return { ...f, assignees: newA, id: !task ? generateId(divisions, newA) : f.id };
  });

  const addUpdate = () => {
    if (!newUpdate.note.trim() || !newUpdate.by.trim()) { alert('Keterangan dan nama wajib diisi'); return; }
    setForm(f => ({ ...f, updates: [...(f.updates || []), { ...newUpdate, id: Date.now() }] }));
    setNewUpdate({ date: todayStr(), note: '', by: currentUser?.name || '' });
  };

  const removeUpdate = (id) => setForm(f => ({ ...f, updates: f.updates.filter(u => u.id !== id) }));

  const handleSubmit = () => {
    if (!form.name.trim()) { alert('Nama tugas wajib diisi'); return; }
    if (!form.assignees.length) { alert('Pilih minimal 1 assignee'); return; }
    onSave({ ...form, id: form.id || generateId(divisions, form.assignees) });
  };

  const sendEmail = () => {
    const to = form.assignees.map(n => allMembers.find(m => m.name === n)?.email).filter(Boolean).join(',');
    const sub = encodeURIComponent(`[Task] ${form.name}`);
    const body = encodeURIComponent(`Halo,\n\nKamu di-assign ke tugas:\n\nID: ${form.id}\nNama: ${form.name}\nProject: ${form.project}\nPrioritas: ${form.priority}\nDeadline: ${formatDate(form.deadline)}${form.driveUrl ? `\nGoogle Drive: ${form.driveUrl}` : ''}\n\n🔗 Pantau progress di FudgyTrack:\n${APP_URL}\n\nTerima kasih.`);
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${sub}&body=${body}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div><h2 className="text-lg font-bold text-slate-900">{task ? 'Edit Tugas' : 'Tugas Baru'}</h2><p className="text-xs text-slate-500 font-mono">{form.id || 'ID otomatis saat pilih assignee'}</p></div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div><label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">Nama Tugas</label><input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="Nama tugas..." /></div>
          <div><label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">Deskripsi</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" rows={2} /></div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">Assignee</label>
            <button onClick={() => setAssigneeOpen(!assigneeOpen)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-left text-sm flex items-center justify-between hover:bg-slate-50">
              <span className={form.assignees.length ? 'text-slate-900' : 'text-slate-400'}>{form.assignees.length ? `${form.assignees.length} dipilih` : 'Pilih assignee...'}</span>
              <ChevronDown size={16} className={`transition-transform ${assigneeOpen ? 'rotate-180' : ''}`} />
            </button>
            {form.assignees.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.assignees.map(name => { const m = allMembers.find(x => x.name === name); return <span key={name} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-white" style={{ backgroundColor: m?.color || '#64748B' }}>{name}<button onClick={() => toggleAssignee(name)}><X size={11} /></button></span>; })}
              </div>
            )}
            {assigneeOpen && (
              <div className="mt-2 border border-slate-200 rounded-lg max-h-48 overflow-y-auto bg-white">
                {Object.entries(divisions).map(([div, { members, color, icon }]) => (
                  <div key={div}>
                    <div className="px-3 py-1.5 bg-slate-50 text-xs font-bold text-slate-600 uppercase sticky top-0">{icon} {div} <span className="font-mono text-orange-500">·{DIVISION_PREFIX[div]}</span></div>
                    {members.map(m => (
                      <label key={m.name} className="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 cursor-pointer border-t border-slate-100">
                        <input type="checkbox" checked={form.assignees.includes(m.name)} onChange={() => toggleAssignee(m.name)} className="accent-orange-500" />
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: color }}>{m.name[0]}</div>
                        <div><div className="text-sm">{m.name}</div><div className="text-[10px] text-slate-400">{m.email}</div></div>
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            )}
            {form.assignees.length > 0 && <button onClick={sendEmail} className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium"><Mail size={13} /> Kirim notifikasi Gmail ({form.assignees.length} orang)</button>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">Project</label><input type="text" value={form.project} onChange={e => setForm({...form, project: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="Nama project..." /></div>
            <div><label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">Prioritas</label><select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">{Object.keys(PRIORITY_CONFIG).map(p => <option key={p}>{p}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">Status</label><select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">{Object.keys(STATUS_CONFIG).map(s => <option key={s}>{s}</option>)}</select></div>
            <div><label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">Progress: {form.progress}%</label><input type="range" min="0" max="100" step="5" value={form.progress} onChange={e => setForm({...form, progress: +e.target.value})} className="w-full mt-2 accent-orange-500" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">Tanggal Mulai</label><input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
            <div><label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">Deadline</label><input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">Link Google Drive (opsional)</label>
            <div className="flex gap-2 items-center">
              <input type="url" value={form.driveUrl || ''} onChange={e => setForm({...form, driveUrl: e.target.value})} className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="https://drive.google.com/..." />
              {form.driveUrl && <a href={form.driveUrl} target="_blank" rel="noreferrer" className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium whitespace-nowrap">Buka →</a>}
            </div>
          </div>

          {/* Update Log */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase">📋 Log Update Pekerjaan</label>
            {form.updates && form.updates.length > 0 && (
              <div className="space-y-2 mb-3">
                {form.updates.map(u => (
                  <div key={u.id} className="flex items-start gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold text-orange-600">{formatDate(u.date)}</span>
                        <span className="text-[11px] text-slate-500">by <span className="font-semibold text-slate-700">{u.by}</span></span>
                      </div>
                      <p className="text-xs text-slate-700 mt-0.5">{u.note}</p>
                    </div>
                    <button onClick={() => removeUpdate(u.id)} className="text-slate-400 hover:text-red-500 mt-0.5"><X size={13} /></button>
                  </div>
                ))}
              </div>
            )}
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-2">
              <p className="text-[11px] font-semibold text-slate-600 uppercase">+ Tambah Update</p>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-[10px] text-slate-500 uppercase">Tanggal</label><input type="date" value={newUpdate.date} onChange={e => setNewUpdate({...newUpdate, date: e.target.value})} className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-xs mt-0.5" /></div>
                <div><label className="text-[10px] text-slate-500 uppercase">Oleh (nama)</label><input type="text" value={newUpdate.by} onChange={e => setNewUpdate({...newUpdate, by: e.target.value})} placeholder="Nama updater" className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-xs mt-0.5" /></div>
              </div>
              <div><label className="text-[10px] text-slate-500 uppercase">Keterangan Update</label><input type="text" value={newUpdate.note} onChange={e => setNewUpdate({...newUpdate, note: e.target.value})} placeholder="Contoh: Rekon bank mutasi sd 20 Feb 2026" className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-xs mt-0.5" /></div>
              <button onClick={addUpdate} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-md text-xs font-semibold"><PlusCircle size={13} /> Tambah</button>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
          <div>{task && onDelete && <button onClick={() => { if (window.confirm('Hapus tugas ini?')) onDelete(task.id); }} className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium inline-flex items-center gap-1.5"><Trash2 size={14} /> Hapus</button>}</div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-lg text-sm">Batal</button>
            <button onClick={handleSubmit} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold">{task ? 'Simpan' : 'Buat Tugas'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [divisions, setDivisions] = useState(DEFAULT_DIVISIONS);
  const [loading, setLoading] = useState(true);
  const [fbStatus, setFbStatus] = useState('connecting');
  const [view, setView] = useState('dashboard');
  const [modalTask, setModalTask] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filters, setFilters] = useState({ search: '', division: 'All', status: 'All', priority: 'All' });
  const [settingsUnlocked, setSettingsUnlocked] = useState(false);
  const [pwModal, setPwModal] = useState(false);
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState(false);

  const allMembers = useMemo(() => Object.entries(divisions).flatMap(([div, { members, color }]) => members.map(m => ({ ...m, division: div, color }))), [divisions]);

  useEffect(() => {
    if (!currentUser) return;
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
    }, (err) => { console.error(err); setFbStatus('error'); setLoading(false); });
    return () => unsub();
  }, [currentUser]);

  const handleLogin = (user) => { setCurrentUser(user); setLoading(true); };
  const handleLogout = () => { setCurrentUser(null); setView('dashboard'); setSettingsUnlocked(false); };

  const handleSettingsClick = () => {
    if (settingsUnlocked) { setView('settings'); return; }
    setPwModal(true); setPwInput(''); setPwError(false);
  };

  const submitPassword = () => {
    if (pwInput === SETTINGS_PASSWORD) { setSettingsUnlocked(true); setPwModal(false); setView('settings'); }
    else setPwError(true);
  };

  const saveTask = async (task) => { await setDoc(doc(db, 'tasks', task.id), task); setModalOpen(false); setModalTask(null); };
  const deleteTask = async (id) => { await deleteDoc(doc(db, 'tasks', id)); setModalOpen(false); setModalTask(null); };

  const filtered = useMemo(() => tasks.filter(t => {
    if (filters.search && !t.name.toLowerCase().includes(filters.search.toLowerCase()) && !t.id.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.division !== 'All' && !t.assignees.some(a => divisions[filters.division]?.members.map(m=>m.name).includes(a))) return false;
    if (filters.status !== 'All' && t.status !== filters.status) return false;
    if (filters.priority !== 'All' && t.priority !== filters.priority) return false;
    return true;
  }), [tasks, filters, divisions]);

  const stats = useMemo(() => {
    const total = tasks.length, done = tasks.filter(t => t.status === 'Done').length;
    const inProgress = tasks.filter(t => t.status === 'In Progress').length;
    const overdue = tasks.filter(t => t.status !== 'Done' && daysUntil(t.deadline) < 0).length;
    const urgent = tasks.filter(t => t.priority === 'Urgent' && t.status !== 'Done').length;
    const blocked = tasks.filter(t => t.status === 'Blocked').length;
    const completionRate = total ? Math.round((done / total) * 100) : 0;
    const byStatus = Object.keys(STATUS_CONFIG).map(s => ({ name: s, value: tasks.filter(t => t.status === s).length, color: STATUS_CONFIG[s].color }));
    const byDivision = Object.entries(divisions).map(([name, { members, color }]) => {
      const dt = tasks.filter(t => t.assignees.some(a => members.map(m=>m.name).includes(a)));
      return { name, color, total: dt.length, done: dt.filter(t => t.status === 'Done').length, active: dt.filter(t => t.status !== 'Done').length };
    });
    return { total, done, inProgress, overdue, urgent, blocked, completionRate, byStatus, byDivision };
  }, [tasks, divisions]);

  if (!currentUser) return <LoginPage onLogin={handleLogin} />;

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
                <div className={`w-1.5 h-1.5 rounded-full ${fbStatus === 'connected' ? 'bg-emerald-400' : 'bg-yellow-400'}`} />
                <p className="text-[10px] text-slate-500">{fbStatus === 'connected' ? 'Connected' : 'Connecting...'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* User info */}
        <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold">{currentUser.name[0]}</div>
          <div className="flex-1 min-w-0"><div className="text-xs font-semibold text-white truncate">{currentUser.name}</div><div className="text-[10px] text-slate-500 truncate">{currentUser.email}</div></div>
          <button onClick={handleLogout} title="Logout" className="text-slate-500 hover:text-red-400 transition"><LogOut size={14} /></button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {[{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }, { id: 'tasks', label: 'Semua Tugas', icon: ListTodo }, { id: 'team', label: 'Tim & Divisi', icon: Users }].map(item => {
            const Icon = item.icon; const active = view === item.id;
            return <button key={item.id} onClick={() => setView(item.id)} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-orange-500 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Icon size={16} />{item.label}</button>;
          })}
          <button onClick={handleSettingsClick} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'settings' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            {settingsUnlocked ? <Settings size={16} /> : <Lock size={16} />} Settings
          </button>
        </nav>
        <div className="p-3 border-t border-slate-800">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 px-3">Divisi</div>
          {Object.entries(divisions).map(([name, { icon }]) => (
            <button key={name} onClick={() => { setView('tasks'); setFilters(f => ({...f, division: name})); }} className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs text-slate-400 hover:bg-slate-800 hover:text-white">
              <span>{icon}</span><span className="flex-1 text-left">{name}</span><span className="text-[10px] font-mono text-orange-400">{DIVISION_PREFIX[name]}</span>
            </button>
          ))}
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{view === 'dashboard' ? 'Dashboard' : view === 'tasks' ? 'Semua Tugas' : view === 'team' ? 'Tim & Divisi' : 'Settings'}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{view === 'dashboard' ? `${stats.total} tugas · ${stats.completionRate}% selesai` : view === 'tasks' ? `${filtered.length} dari ${tasks.length} tugas` : view === 'team' ? `${allMembers.length} anggota` : 'Kelola data karyawan'}</p>
          </div>
          {view !== 'settings' && (
            <button onClick={() => { setModalTask(null); setModalOpen(true); }} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5"><Plus size={16} /> Tugas Baru</button>
          )}
        </header>

        <div className="p-6">
          {view === 'settings' && <SettingsView divisions={divisions} setDivisions={setDivisions} />}

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
                  { label: 'Anggota', value: allMembers.length, icon: Users, c: 'text-purple-700 bg-purple-100' },
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
            </div>
          )}

          {view === 'tasks' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} placeholder="Cari tugas atau ID..." className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
                {[['division', Object.keys(divisions)], ['status', Object.keys(STATUS_CONFIG)], ['priority', Object.keys(PRIORITY_CONFIG)]].map(([key, opts]) => (
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
                      {['ID', 'Tugas', 'Assignee', 'Project', 'Priority', 'Status', 'Progress', 'Drive', 'Update Terakhir', 'Deadline'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-slate-600 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr><td colSpan={10} className="text-center py-12 text-slate-400 text-sm">Tidak ada tugas.</td></tr>
                      ) : filtered.map(t => {
                        const days = daysUntil(t.deadline);
                        const overdue = days < 0 && t.status !== 'Done';
                        const soon = days >= 0 && days <= 3 && t.status !== 'Done';
                        const lastUpdate = t.updates && t.updates.length > 0 ? t.updates[t.updates.length - 1] : null;
                        return (
                          <tr key={t.id} onClick={() => { setModalTask(t); setModalOpen(true); }} className="border-b border-slate-100 hover:bg-orange-50 cursor-pointer transition-colors">
                            <td className="px-4 py-3 text-xs font-mono font-bold text-orange-600">{t.id}</td>
                            <td className="px-4 py-3"><div className="font-semibold text-slate-900 text-sm">{t.name}</div><div className="text-xs text-slate-500 line-clamp-1">{t.description}</div></td>
                            <td className="px-4 py-3"><AssigneeAvatars assignees={t.assignees} divisions={divisions} /></td>
                            <td className="px-4 py-3 text-xs text-slate-700">{t.project}</td>
                            <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                            <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                            <td className="px-4 py-3"><div className="flex items-center gap-2 w-24"><div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${t.progress}%`, backgroundColor: t.progress === 100 ? '#10B981' : '#F97316' }} /></div><span className="text-xs font-semibold text-slate-700 w-8">{t.progress}%</span></div></td>
                            <td className="px-4 py-3" onClick={e => e.stopPropagation()}>{t.driveUrl ? <a href={t.driveUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline font-medium">Buka →</a> : <span className="text-xs text-slate-300">-</span>}</td>
                            <td className="px-4 py-3">{lastUpdate ? <div><div className="text-[11px] font-bold text-orange-600">{formatDate(lastUpdate.date)}</div><div className="text-[10px] text-slate-500 line-clamp-1">{lastUpdate.note}</div><div className="text-[10px] text-slate-400">by {lastUpdate.by}</div></div> : <span className="text-xs text-slate-300">-</span>}</td>
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
              {Object.entries(divisions).map(([name, { members, color, icon }]) => {
                const divTasks = tasks.filter(t => t.assignees.some(a => members.map(m=>m.name).includes(a)));
                return (
                  <div key={name} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3" style={{ backgroundColor: `${color}08` }}>
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ backgroundColor: `${color}20` }}>{icon}</div>
                      <div className="flex-1"><h3 className="font-bold text-slate-900">{name} <span className="font-mono text-xs text-orange-500">{DIVISION_PREFIX[name]}</span></h3><p className="text-xs text-slate-500">{members.length} anggota · {divTasks.length} tugas</p></div>
                      <button onClick={() => { setView('tasks'); setFilters(f => ({...f, division: name})); }} className="text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-white transition" style={{ color }}>Lihat tugas →</button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
                      {members.map(member => {
                        const mt = tasks.filter(t => t.assignees.includes(member.name));
                        return (
                          <div key={member.name} className="p-4 border-r border-b border-slate-100 last:border-r-0">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: color }}>{member.name[0]}</div>
                              <div><div className="font-semibold text-slate-900 text-sm">{member.name}</div><div className="text-[10px] text-slate-500">{member.email}</div></div>
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

      {/* Password Modal */}
      {pwModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPwModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3"><Lock size={22} className="text-orange-500" /></div>
              <h2 className="font-bold text-slate-900 text-lg">Settings Terkunci</h2>
              <p className="text-xs text-slate-500 mt-1">Masukkan password untuk akses Settings</p>
            </div>
            <div className="px-6 pb-6 space-y-3">
              <input type="password" value={pwInput} onChange={e => { setPwInput(e.target.value); setPwError(false); }}
                onKeyDown={e => e.key === 'Enter' && submitPassword()}
                placeholder="Password..." autoFocus
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 ${pwError ? 'border-red-400 bg-red-50' : 'border-slate-300'}`} />
              {pwError && <p className="text-xs text-red-500 font-medium">Password salah.</p>}
              <button onClick={submitPassword} className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold">Masuk</button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && <TaskModal task={modalTask} onClose={() => { setModalOpen(false); setModalTask(null); }} onSave={saveTask} onDelete={modalTask ? deleteTask : null} divisions={divisions} currentUser={currentUser} />}
    </div>
  );
}
