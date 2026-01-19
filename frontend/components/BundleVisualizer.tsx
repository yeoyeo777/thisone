
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { WalletBundle } from '../types';

interface BundleVisualizerProps {
  bundles: WalletBundle[];
}

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6'];

const BundleVisualizer: React.FC<BundleVisualizerProps> = ({ bundles }) => {
  const data = bundles.map((b, i) => ({
    name: `Cluster ${b.clusterId}`,
    value: b.percentageSupply,
    count: b.wallets.length
  }));

  // Add "Public" share for visualization
  const totalBundled = data.reduce((acc, curr) => acc + curr.value, 0);
  if (totalBundled < 100) {
    data.push({ name: 'Other Holders', value: 100 - totalBundled, count: 0 });
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
        Wallet Clustering Analysis
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-400 italic">
            Detected clusters indicate addresses that received funds from a single source or moved assets simultaneously.
          </p>
          
          <div className="space-y-2">
            {bundles.map((bundle, i) => (
              <div key={bundle.clusterId} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                <div>
                  <div className="font-bold flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                    Cluster {bundle.clusterId}
                  </div>
                  <div className="text-xs text-gray-400">{bundle.wallets.length} linked wallets</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-blue-400">{bundle.percentageSupply}%</div>
                  <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Supply</div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
            <h4 className="text-rose-400 font-bold text-sm mb-1 uppercase">Rug Risk Profile</h4>
            <p className="text-xs text-gray-300">
              High concentration of supply in clusters (bundled wallets) allows developers to exit liquidity rapidly without affecting standard charts immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BundleVisualizer;
