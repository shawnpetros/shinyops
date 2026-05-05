import { useState } from 'react';
import { CalculatorPanel } from './components/CalculatorPanel';
import { DexTracker } from './components/DexTracker';
import { Header } from './components/Header';
import { Legend } from './components/Legend';
import { SVModule } from './components/SVModule';
import { Tabs } from './components/Tabs';
import { ZAModule } from './components/ZAModule';

type TabId = 'calculator' | 'za' | 'sv' | 'tracker' | 'legend';

const TABS: { id: TabId; label: string }[] = [
  { id: 'calculator', label: 'Calculator' },
  { id: 'za', label: '🏙️ Z-A Mode' },
  { id: 'sv', label: '🥪 SV Mode' },
  { id: 'tracker', label: 'Dex tracker' },
  { id: 'legend', label: 'Legend' },
];

export default function App() {
  const [tab, setTab] = useState<TabId>('calculator');

  return (
    <div className="app">
      <Header />
      <Tabs<TabId> current={tab} options={TABS} onChange={setTab} />
      {tab === 'calculator' && <CalculatorPanel />}
      {tab === 'za' && <ZAModule />}
      {tab === 'sv' && <SVModule />}
      {tab === 'tracker' && <DexTracker />}
      {tab === 'legend' && <Legend />}
    </div>
  );
}
