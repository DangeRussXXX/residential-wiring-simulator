import type { ServiceProject } from './projectWorkflow';

const terminal = (x: number, y: number, label: string, color: string) => <g key={`${label}-${x}-${y}`}><circle cx={x} cy={y} r="9" fill="#c8b28b" stroke="#59452e" strokeWidth="2"/><circle cx={x} cy={y} r="3" fill="#554b43"/><text x={x} y={y-16} fontSize="12" textAnchor="middle" fill={color}>{label}</text></g>;
export default function ServiceConnectionView({project}: {project: ServiceProject}) {
 const closed=project.service.mainDisconnectClosed;
 return <div style={{border:'1px solid #37657b',borderRadius:12,background:'#0c1723',padding:14,marginBottom:16}}>
 <h3 style={{color:'#79dfff',margin:'2px 0 8px'}}>Service conductors, disconnect and distribution lugs</h3>
 <p style={{color:'#afc5d0',fontSize:12}}>Illustrative equipment interior — {project.service.route==='UNDERGROUND'?'underground lateral':'overhead service drop'} · 120/240V · {project.service.amperage}A. Select the breaker below to configure its circuit.</p>
 <svg viewBox="0 0 900 570" style={{width:'100%',maxHeight:630,display:'block'}} role="img" aria-label="Utility L1 L2 and neutral through meter and separate service disconnect to feeder lugs and isolated neutral and ground bars">
 <defs><pattern id="metalgrain" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M0 0V10" stroke="#364b5b" strokeWidth="1"/></pattern></defs>
 <rect x="20" y="20" width="860" height="530" rx="14" fill="#172532" stroke="#607888" strokeWidth="3"/>
 <text x="450" y="47" fill="#f4f8fc" textAnchor="middle" fontWeight="bold" fontSize="19">{project.service.route==='UNDERGROUND'?'UNDERGROUND SERVICE':'OVERHEAD SERVICE'} → METER → DISCONNECT → DISTRIBUTION</text>
 <rect x="45" y="65" width="245" height="103" rx="8" fill="#223746" stroke="#6c98b2"/>
 <text x="167" y="88" fill="#c8e9fa" textAnchor="middle" fontSize="15">UTILITY / METER</text>
 <text x="167" y="108" fill="#9dc2d7" textAnchor="middle" fontSize="11">Supply conductors (conceptual)</text>
 {terminal(100,141,'L1','#ff9999')}{terminal(167,141,'L2','#a7bfff')}{terminal(234,141,'N','#f1f1f1')}
 <rect x="327" y="65" width="245" height="103" rx="8" fill="#223746" stroke="#6c98b2"/>
 <text x="450" y="87" fill="#c8e9fa" textAnchor="middle" fontSize="15">SERVICE DISCONNECT</text>
 <text x="450" y="105" fill="#a7c7d7" textAnchor="middle" fontSize="12">{project.service.amperage}A · {closed?'CLOSED':'OPEN'}</text>
 {terminal(380,141,'L1','#ff9999')}{terminal(450,141,'L2','#a7bfff')}{terminal(520,141,'N','#fff')}
 <path d="M109 141 H371" stroke="#e67d7d" strokeWidth="6" fill="none" opacity=".9"/><path d="M176 151 H441" stroke="#8aaef4" strokeWidth="6" fill="none"/><path d="M243 161 H511" stroke="#e5e5e5" strokeWidth="5" fill="none"/>
 <rect x="615" y="65" width="240" height="103" rx="8" fill="#203645" stroke="#6c98b2"/>
 <text x="735" y="88" fill="#c8e9fa" textAnchor="middle" fontSize="15">FEEDER OUTPUT</text>
 <text x="735" y="109" fill="#a7c7d7" textAnchor="middle" fontSize="11">L1 · L2 · N · EGC</text>
 {terminal(647,141,'L1','#ff9999')}{terminal(707,141,'L2','#a7bfff')}{terminal(767,141,'N','#fff')}{terminal(827,141,'G','#99e6ac')}
 <path d="M529 141 H638" stroke="#e67d7d" strokeWidth="6" fill="none" opacity={closed?1:.2}/><path d="M529 150 H698" stroke="#8aaef4" strokeWidth="5" fill="none" opacity={closed?1:.2}/><path d="M529 160 H758" stroke="#e5e5e5" strokeWidth="4" fill="none"/><path d="M540 166 H827 V141" stroke="#7bcb96" strokeWidth="4" fill="none"/>
 <text x="450" y="198" fill="#c5d5e0" textAnchor="middle" fontSize="12">Feeder to downstream distribution panel (separate neutral and equipment ground)</text>
 <rect x="100" y="218" width="700" height="300" rx="10" fill="url(#metalgrain)" stroke="#7894a5" strokeWidth="4"/>
 <rect x="115" y="233" width="670" height="36" rx="4" fill="#0f1d2a"/><text x="450" y="257" fill="#e8f6ff" textAnchor="middle" fontSize="18" fontWeight="bold">MAIN DISTRIBUTION PANEL</text>
 <path d="M310 283 V468" stroke="#d77b7b" strokeWidth="14"/><path d="M425 283 V468" stroke="#7799e6" strokeWidth="14"/>
 <text x="310" y="295" fill="white" textAnchor="middle" fontSize="12">L1 BUS</text><text x="425" y="295" fill="white" textAnchor="middle" fontSize="12">L2 BUS</text>
 {terminal(310,312,'L1 LUG','#ffd2d2')}{terminal(425,312,'L2 LUG','#cbd9ff')}
 <rect x="180" y="345" width="85" height="36" rx="5" fill="#304658" stroke="#8ca5b8"/><text x="222" y="367" textAnchor="middle" fill="#fff" fontSize="12">BRANCH</text>
 <rect x="470" y="345" width="85" height="36" rx="5" fill="#304658" stroke="#8ca5b8"/><text x="512" y="367" textAnchor="middle" fill="#fff" fontSize="12">BRANCH</text>
 <path d="M265 364 H310 M425 364 H470" stroke="#b5b7ba" strokeWidth="4"/>
 <rect x="575" y="296" width="78" height="177" rx="5" fill="#293d4a" stroke="#e5e5e5"/><rect x="678" y="296" width="78" height="177" rx="5" fill="#293d4a" stroke="#8fcfa4"/>
 <text x="614" y="319" fill="#fff" textAnchor="middle" fontSize="12">NEUTRAL</text><text x="614" y="334" fill="#fff" textAnchor="middle" fontSize="12">BAR</text>
 <text x="717" y="319" fill="#c0f1c9" textAnchor="middle" fontSize="12">GROUND</text><text x="717" y="334" fill="#c0f1c9" textAnchor="middle" fontSize="12">BAR</text>
 {[359,390,421,452].map(y=><g key={y}>{terminal(614,y,'','#fff')}{terminal(717,y,'','#9fdfb1')}</g>)}
 <text x="450" y="501" fill="#b5d0e0" textAnchor="middle" fontSize="12">No neutral-ground bonding jumper in this downstream distribution panel</text>
 </svg>
 <p style={{fontSize:12,color:'#e3bc8b',marginBottom:0}}>Training illustration only: conductor colors are visual identifiers, not a universal field color standard. It does not establish permitted terminations, conductor sizes, utility specifications, or code compliance. The disconnect is not yet electrically connected to the solver.</p>
 </div>;
}
