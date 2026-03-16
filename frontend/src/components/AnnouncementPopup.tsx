import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, ShieldCheck, Calendar, Info } from 'lucide-react';
import { cn } from '../utils/cn';

interface AnnouncementPopupProps {
    items: any[];
    onDismiss: (id: string, type: 'announcement' | 'policy') => void;
}

const AnnouncementPopup = ({ items, onDismiss }: AnnouncementPopupProps) => {
    if (items.length === 0) return null;

    const currentItem = items[0];
    const isPolicy = !!currentItem.lastUpdated;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-brand-surface border border-brand-border w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden relative"
                >
                    {/* Header/Banner */}
                    <div className={cn(
                        "p-8 flex items-center justify-between border-b border-brand-border",
                        isPolicy ? "bg-emerald-500/10" : "bg-brand-primary/10"
                    )}>
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "p-3 rounded-2xl shadow-lg",
                                isPolicy ? "bg-emerald-500" : "bg-brand-primary"
                            )}>
                                {isPolicy ? <ShieldCheck className="w-6 h-6 text-white" /> : <Bell className="w-6 h-6 text-white" />}
                            </div>
                            <div>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted opacity-60">
                                    New {isPolicy ? 'Policy' : 'Announcement'}
                                </h3>
                                <p className="text-brand-text font-black uppercase tracking-tight text-lg">
                                    System Protocol Update
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={() => onDismiss(currentItem.id || currentItem._id, isPolicy ? 'policy' : 'announcement')}
                            className="p-2 hover:bg-black/5 rounded-xl transition-colors group"
                        >
                            <X className="w-5 h-5 text-brand-muted group-hover:text-brand-text" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-8 space-y-6">
                        <div className="space-y-4">
                            <h2 className="text-2xl font-black text-brand-text tracking-tighter leading-tight">
                                {currentItem.title}
                            </h2>
                            <p className="text-brand-muted font-medium text-base leading-relaxed">
                                {isPolicy ? currentItem.description : currentItem.message}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-4 pt-4 border-t border-brand-border">
                            <div className="flex items-center gap-2 px-4 py-2 bg-brand-bg rounded-xl border border-brand-border">
                                <Calendar className="w-4 h-4 text-brand-primary" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-brand-text opacity-60">
                                    {currentItem.date || currentItem.lastUpdated}
                                </span>
                            </div>
                            {!isPolicy && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-brand-bg rounded-xl border border-brand-border">
                                    <Info className="w-4 h-4 text-brand-primary" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-text opacity-60">
                                        {currentItem.type || 'Company'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-8 bg-table-header border-t border-brand-border flex justify-end">
                        <button
                            onClick={() => onDismiss(currentItem.id || currentItem._id, isPolicy ? 'policy' : 'announcement')}
                            className="bg-brand-primary text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            Acknowledge & Close
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default AnnouncementPopup;
