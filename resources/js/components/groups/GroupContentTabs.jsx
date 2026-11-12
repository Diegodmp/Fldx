import { useState } from 'react';
import GroupPollsSection from './GroupPollsSection';
import GroupWatchlistSection from './GroupWatchlistSection';

const TABS = [
    { id: 'watchlist', label: 'Watchlist' },
    { id: 'polls', label: 'Votaciones' },
];

export default function GroupContentTabs({
    groupId,
    currentUserId,
    isAdmin,
    openCreatePollOnMount = false,
    proposeMovieOnCreate = null,
}) {
    const [activeTab, setActiveTab] = useState(openCreatePollOnMount ? 'polls' : 'watchlist');

    return (
        <section className="mt-10">
            <div className="mb-6 flex rounded-lg border border-border-soft bg-white/[0.03] p-[3px]">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 cursor-pointer rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                            activeTab === tab.id
                                ? 'border border-border-strong bg-white/[0.06] text-txt'
                                : 'border border-transparent bg-transparent text-txt-dim hover:text-txt'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'watchlist' ? (
                <GroupWatchlistSection
                    key="watchlist"
                    groupId={groupId}
                    currentUserId={currentUserId}
                    isAdmin={isAdmin}
                />
            ) : (
                <GroupPollsSection
                    key="polls"
                    groupId={groupId}
                    currentUserId={currentUserId}
                    isAdmin={isAdmin}
                    openCreatePollOnMount={openCreatePollOnMount}
                    proposeMovieOnCreate={proposeMovieOnCreate}
                />
            )}
        </section>
    );
}
