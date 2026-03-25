import { 
  Ship, MapPin, Clock, ShieldCheck, Wind, MessageSquare,
  Edit3, Save, Send, X, AlertCircle, ChevronRight, Search, Calendar, Filter, RefreshCw
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useUserProfile } from '../hooks/useUserProfile';
import LogbookEntryModal from './LogbookEntryModal';
import ActivityChatModal from './ActivityChatModal';

const formatTime = (ts) => {
  if (!ts) return '--:--';
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const activityColor = (activity) => {
  const map = {
    'Loading': '#10b981', 'Unloading': '#f59e0b',
    'Navigation': '#3b82f6', 'Anchorage': '#8b5cf6',
    'Stand-by': '#64748b', 'Port Operations': '#06b6d4', 'Mooring': '#14b8a6'
  };
  return map[activity] || '#94a3b8';
};

export default function MobileCrewActivity({ tab = 'all' }) {
  const { activities, loading, fetchActivities } = useData();
  const { profile } = useUserProfile();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [logbookModal, setLogbookModal] = useState(null);
  const [chatModal, setChatModal] = useState(null);

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const filtered = (activities || []).filter(a => {
    const isSubmitted = a.logbookStatus === 'submitted' || a.logbookStatus === 'approved';
    
    // Tab filtering
    if (tab === 'submitted' && !isSubmitted) return false;
    if (tab === 'all' && isSubmitted) return false; // In "Vessel Activity" show ONLY to-submit

    // Search term
    if (searchTerm && !a.activity.toLowerCase().includes(searchTerm.toLowerCase()) && !a.vessel.toLowerCase().includes(searchTerm.toLowerCase())) return false;

    // Month filtering (only for submitted tab by default)
    if (tab === 'submitted') {
        const aMonth = new Date(a.startTime).getMonth();
        if (aMonth !== selectedMonth) return false;
    }

    return true;
  }).sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

  // ─── Loading State ─────────────────────────────────────────────
  if (loading && !activities.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-on-surface/40 font-black text-xs uppercase tracking-widest">Caricamento...</p>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Header Filters */}
      <div className="sticky top-0 z-20 bg-[#f7f9fb]/95 backdrop-blur-md px-1 pt-2 pb-4 space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface/30" />
          <input 
            type="text" 
            placeholder="Search activities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-surface-low/50 rounded-2xl pl-10 pr-4 py-3 text-xs font-bold text-on-surface placeholder:text-on-surface/20 shadow-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>

        {/* Action Row */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
          {tab === 'submitted' && (
            <div className="flex items-center gap-1.5 bg-white border border-surface-low/50 rounded-xl px-3 py-2 shadow-sm shrink-0">
               <Calendar size={12} className="text-primary/60" />
               <select 
                 value={selectedMonth} 
                 onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                 className="bg-transparent text-[10px] font-black uppercase tracking-widest text-on-surface/60 outline-none"
               >
                 {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
               </select>
            </div>
          )}
          <button onClick={fetchActivities} className="w-10 h-10 bg-white border border-surface-low/50 rounded-xl flex items-center justify-center text-on-surface/30 active:bg-surface-low shadow-sm">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {!filtered.length ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-4">
          <div className="w-16 h-16 rounded-full bg-surface-low flex items-center justify-center">
            <AlertCircle size={28} className="text-on-surface/20" />
          </div>
          <div>
            <p className="font-manrope font-extrabold text-on-surface/40">No activities found</p>
            <p className="text-xs text-on-surface/20 mt-1">Try adjusting your filters or search term</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
            {filtered.map((a) => {
            const isActive = a.status === 'in-progress';
            const isSubmitted = a.logbookStatus === 'submitted' || a.logbookStatus === 'approved';
            const color = activityColor(a.activity);

            return (
                <div
                key={a.id}
                className={`relative bg-surface-lowest rounded-2xl overflow-hidden shadow-sm border border-surface-low/40 ${isActive ? 'ring-2 ring-primary/25' : ''}`}
                >
                <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: color }} />
                <div className="pl-4 pr-4 py-4 ml-1">
                    <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 pr-2">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-manrope font-extrabold text-[16px] text-on-surface leading-tight">{a.activity}</h3>
                        {isSubmitted && (
                            <span className="flex items-center gap-1 bg-green-50 text-green-600 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                            <ShieldCheck size={9}/> Inviato
                            </span>
                        )}
                        </div>
                        <div className="flex items-center gap-1.5">
                        <MapPin size={11} className="text-on-surface/30 shrink-0" />
                        <span className="text-xs font-bold text-on-surface/50 truncate">{a.geofence || '—'}</span>
                        </div>
                    </div>
                    <div className="shrink-0 text-right">
                        <div className="text-[10px] font-manrope font-bold text-on-surface">
                        {formatTime(a.startTime)} › <span className={!a.endTime ? 'text-primary' : ''}>{formatTime(a.endTime)}</span>
                        </div>
                    </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-surface-low/40">
                    <div className="flex items-center gap-2">
                        <Ship size={12} className="text-on-surface/30" />
                        <span className="text-[11px] font-bold text-on-surface/50">{a.vessel}</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <button onClick={() => setChatModal(a)} className="relative p-2 bg-surface-low/20 rounded-lg">
                            <MessageSquare size={14} className="text-primary/60" />
                            {a.unreadMsgCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-secondary rounded-full border-2 border-white" />
                            )}
                        </button>
                        
                        {!isSubmitted && (
                            <button 
                                onClick={() => setLogbookModal(a)}
                                className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md shadow-primary/20 active:scale-95 transition-all"
                            >
                                <Edit3 size={12} /> Edit
                            </button>
                        )}
                        {isSubmitted && (
                             <button 
                                onClick={() => setLogbookModal(a)}
                                className="flex items-center gap-2 bg-surface-low/50 text-on-surface/40 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                            >
                                <Edit3 size={12} /> View
                            </button>
                        )}
                    </div>
                    </div>
                </div>
                </div>
            );
            })}
        </div>
      )}

      {/* Modals */}
      {logbookModal && (
          <LogbookEntryModal 
              activity={logbookModal} 
              profile={profile}
              entryMeta={logbookModal.logbookEntry}
              onClose={() => setLogbookModal(null)} 
              onSaved={fetchActivities}
          />
      )}
      
      {chatModal && (
        <ActivityChatModal
          activity={chatModal}
          profile={profile}
          onClose={() => { setChatModal(null); fetchActivities(); }}
        />
      )}
    </div>
  );
}
