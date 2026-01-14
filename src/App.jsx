import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Clock, 
  FileText, 
  DollarSign, 
  User, 
  Shield, 
  Briefcase, 
  ChevronRight, 
  Settings,
  RefreshCw,
  Calendar,
  Database,
  AlertCircle,
  XOctagon,
  HelpCircle
} from 'lucide-react';

// --- Constants & Config ---

const STAGES = {
  APPLICATION: 'application',
  PRE_APPROVAL: 'pre_approval',
  DOCUMENTS: 'documents',
  UNDERWRITING: 'underwriting',
  APPROVAL_OFFER: 'approval_offer',
  CLOSING: 'closing',
  DISBURSED: 'disbursed',
  DISQUALIFIED: 'disqualified'
};

const STAGE_ORDER = [
  STAGES.APPLICATION,
  STAGES.PRE_APPROVAL,
  STAGES.DOCUMENTS,
  STAGES.UNDERWRITING,
  STAGES.APPROVAL_OFFER,
  STAGES.CLOSING,
  STAGES.DISBURSED
];

const STAGE_URL_SLUGS = {
  [STAGES.APPLICATION]: 'startYourApplication',
  [STAGES.PRE_APPROVAL]: 'analyzingEligibility',
  [STAGES.DOCUMENTS]: 'documentVerification',
  [STAGES.UNDERWRITING]: 'underwritingReview',
  [STAGES.APPROVAL_OFFER]: 'offerReview',
  [STAGES.CLOSING]: 'finalClosing',
  [STAGES.DISBURSED]: 'fundsDisbursed',
  [STAGES.DISQUALIFIED]: 'disqualified'
};

// Initial Empty State
const INITIAL_STATE = {
  id: '', 
  applicantName: '',
  email: '',
  income: '',
  loanAmount: 50000,
  creditScore: 720,
  status: STAGES.APPLICATION,
  documentsUploaded: false,
  history: [],
  simulatedStartDate: new Date().toISOString(),
  currentSimulatedDate: new Date().toISOString(),
};

// --- UI Components ---

const Button = ({ children, onClick, variant = 'primary', className = '', ...props }) => {
  const baseStyle = "px-4 py-2 rounded-md font-medium transition-all duration-200 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
    secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50",
    success: "bg-green-600 text-white hover:bg-green-700",
    admin: "bg-slate-800 text-slate-200 hover:bg-slate-700 text-sm"
  };

  const handleClick = (e) => {
    // 5% chance to simulate a UI/API lag error in logs
    if (Math.random() < 0.05) {
        console.error("[Analytics Demo] Simulated API Timeout Error: 504 Gateway Timeout");
    }
    onClick && onClick(e);
  };
  
  return (
    <button 
      onClick={handleClick} 
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const Input = ({ label, id, type = "text", value, onChange, placeholder, error }) => (
  <div className="mb-4">
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type={type}
      id={id}
      data-analytics-id={`input-${id}`}
      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${error ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-500'}`}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
    {error && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle size={12}/> {error}</p>}
  </div>
);

const Card = ({ children, title, subtitle, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
    {(title || subtitle) && (
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-start">
        <div>
            {title && <h2 className="text-lg font-semibold text-gray-900">{title}</h2>}
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {/* Dead Click Target for CSQ/Heap Friction Discovery */}
        <div className="text-gray-400 cursor-help hover:text-gray-600" title="Help" id="dead-click-help">
            <HelpCircle size={20} />
        </div>
      </div>
    )}
    <div className="p-6">
      {children}
    </div>
  </div>
);

const Badge = ({ status }) => {
  const styles = {
    [STAGES.APPLICATION]: "bg-blue-100 text-blue-800",
    [STAGES.PRE_APPROVAL]: "bg-purple-100 text-purple-800",
    [STAGES.DOCUMENTS]: "bg-yellow-100 text-yellow-800",
    [STAGES.UNDERWRITING]: "bg-orange-100 text-orange-800",
    [STAGES.APPROVAL_OFFER]: "bg-indigo-100 text-indigo-800",
    [STAGES.CLOSING]: "bg-pink-100 text-pink-800",
    [STAGES.DISBURSED]: "bg-green-100 text-green-800",
    [STAGES.DISQUALIFIED]: "bg-red-100 text-red-800", 
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide ${styles[status] || 'bg-gray-100'}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

// --- Views ---

const ApplicationForm = ({ data, updateData, nextStage, identifyUser }) => {
  const [errors, setErrors] = useState({});

  const validate = () => {
      const newErrors = {};
      if (!data.applicantName) newErrors.applicantName = "Name is required";
      if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) newErrors.email = "Valid email is required";
      if (!data.income || data.income < 1000) newErrors.income = "Valid annual income required";
      return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return; 
    }
    
    identifyUser(data.email, data.applicantName, data.id);
    nextStage(STAGES.PRE_APPROVAL, "Application Submitted");
  };

  return (
    <Card title="Start your Application" subtitle="Step 1 of 5">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input 
            label="Full Name" 
            id="applicantName" 
            value={data.applicantName} 
            onChange={(e) => updateData('applicantName', e.target.value)} 
            placeholder="e.g. Jane Doe"
            error={errors.applicantName}
          />
          <Input 
            label="Email Address" 
            id="email" 
            type="email"
            value={data.email} 
            onChange={(e) => updateData('email', e.target.value)} 
            placeholder="jane@example.com"
            error={errors.email}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input 
            label="Annual Income ($)" 
            id="income" 
            type="number"
            value={data.income} 
            onChange={(e) => updateData('income', e.target.value)} 
            placeholder="85000"
            error={errors.income}
          />
          <Input 
            label="Requested Loan Amount" 
            id="loanAmount" 
            type="number"
            value={data.loanAmount} 
            onChange={(e) => updateData('loanAmount', e.target.value)} 
          />
        </div>
        <div className="mt-6 flex justify-end">
          <Button type="submit" id="btn-submit-application" data-analytics-id="submit-app">
            Check Eligibility <ChevronRight size={16} />
          </Button>
        </div>
      </form>
    </Card>
  );
};

const DocumentsView = ({ nextStage }) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = () => {
    setIsUploading(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setIsUploading(false);
        nextStage(STAGES.UNDERWRITING, "Documents Uploaded");
      }
    }, 200);
  };

  return (
    <Card title="Document Verification" subtitle="Please upload your recent pay stubs.">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center hover:bg-gray-50 transition-colors cursor-pointer" onClick={handleUpload} id="dropzone">
        <div className="mx-auto h-12 w-12 text-gray-400 mb-3">
          <FileText size={48} />
        </div>
        <h3 className="text-sm font-medium text-gray-900">Upload Pay Stubs</h3>
        <p className="text-xs text-gray-500 mt-1">PDF or PNG up to 10MB</p>
        
        {isUploading && (
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-200" style={{ width: `${uploadProgress}%` }}></div>
          </div>
        )}
      </div>
      <div className="mt-6 flex justify-between items-center">
         <p className="text-sm text-gray-500 italic">Note: Simulates a document upload event.</p>
         <Button onClick={handleUpload} disabled={isUploading} id="btn-upload-docs">
            {isUploading ? 'Uploading...' : 'Select Files'}
         </Button>
      </div>
    </Card>
  );
};

const WaitingRoom = ({ title, message, icon: Icon }) => (
  <Card className="text-center py-12">
    <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
      <Icon size={32} className="text-blue-600" />
    </div>
    <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
    <p className="text-gray-600 max-w-md mx-auto mb-8">{message}</p>
    <div className="bg-yellow-50 border border-yellow-200 rounded p-4 text-sm text-yellow-800 inline-block mx-auto">
      <div className="flex items-center gap-2">
        <AlertCircle size={16} />
        <span>Waiting for system update...</span>
      </div>
    </div>
  </Card>
);

const OfferReview = ({ data, nextStage }) => (
  <Card title="Loan Approved!" subtitle="Review your final terms.">
    <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
      <div className="flex justify-between items-end border-b border-green-200 pb-4 mb-4">
        <div>
          <p className="text-sm text-green-800 font-medium">Approved Amount</p>
          <p className="text-3xl font-bold text-green-900">${parseInt(data.loanAmount).toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-green-800 font-medium">Interest Rate</p>
          <p className="text-xl font-bold text-green-900">5.4% APR</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm text-green-900">
        <div>Term: <strong>60 Months</strong></div>
        <div>Payment: <strong>$950/mo</strong></div>
      </div>
    </div>
    <div className="flex justify-end gap-3">
      <Button variant="secondary">Download Terms</Button>
      <Button onClick={() => nextStage(STAGES.CLOSING, "Terms Accepted")} id="btn-accept-offer">
        Accept Terms
      </Button>
    </div>
  </Card>
);

const ClosingView = ({ nextStage }) => {
  const handleSubmit = (e) => {
      e.preventDefault();
      nextStage(STAGES.DISBURSED, "Loan Closed - Final Submission");
  };

  return (
    <Card title="Final Closing" subtitle="Sign documents electronically.">
      <form onSubmit={handleSubmit}> 
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50 cursor-pointer">
            <input type="checkbox" className="h-5 w-5 text-blue-600" />
            <span className="text-gray-700">Truth in Lending Disclosure</span>
          </div>
          <div className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50 cursor-pointer">
            <input type="checkbox" className="h-5 w-5 text-blue-600" />
            <span className="text-gray-700">Promissory Note</span>
          </div>
        </div>
        <Button type="submit" className="w-full" id="btn-sign-close">
          Sign & Finalize
        </Button>
      </form>
    </Card>
  );
};

const SuccessView = () => (
  <Card className="text-center py-12 bg-gradient-to-b from-white to-green-50">
    <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
      <CheckCircle size={40} className="text-green-600" />
    </div>
    <h2 className="text-3xl font-bold text-gray-900 mb-2">Funds Disbursed!</h2>
    <p className="text-gray-600 mb-8">The funds have been sent to your account.</p>
    <Button variant="secondary" onClick={() => window.location.reload()}>New Application</Button>
  </Card>
);

const DisqualifiedView = () => (
    <Card className="text-center py-12 bg-gradient-to-b from-white to-red-50">
      <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
        <XOctagon size={40} className="text-red-600" />
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Application Disqualified</h2>
      <p className="text-gray-600 max-w-md mx-auto mb-8">
        We regret that your application was not approved at this time.
      </p>
      <Button variant="secondary" onClick={() => window.location.reload()}>Try Again</Button>
    </Card>
);

// --- Main Application ---

export default function LoanProcessDemo() {
  const [data, setData] = useState(INITIAL_STATE);
  const [showAdmin, setShowAdmin] = useState(true);

  const identifyUser = (email, name, id) => {
    if (window.heap && typeof window.heap.identify === 'function') {
        window.heap.identify(email);
        window.heap.addUserProperties({
            name: name,
            loan_app_id: id,
            demo_user: "automation"
        });
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('swiftloan_demo_state');
    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch (e) { console.error("Load failed", e); }
    } else {
      setData(prev => ({ ...prev, id: `LN-${Math.floor(Math.random() * 10000)}` }));
    }
  }, []);

  useEffect(() => {
    if (data.id) localStorage.setItem('swiftloan_demo_state', JSON.stringify(data));
  }, [data]);

  // Sync URL with Stage for Analytics
  useEffect(() => {
    const slug = STAGE_URL_SLUGS[data.status];
    if (slug) {
      const newUrl = `${window.location.pathname}?step=${slug}`;
      try { window.history.replaceState(null, '', newUrl); } catch (e) {}
    }
  }, [data.status]);

  const updateData = (key, value) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const changeStage = (newStage, actionLabel) => {
    // TRACK SERVER-SIDE APPROVAL EVENT AS CUSTOM HEAP EVENT
    if (actionLabel === "Admin Force: Approved") {
        if (window.heap && typeof window.heap.track === 'function') {
            window.heap.track('Underwriting Approved (Server Event)', {
                simulated_date: data.currentSimulatedDate,
                loan_app_id: data.id,
                time_to_approval_simulated: (new Date(data.currentSimulatedDate) - new Date(data.simulatedStartDate))
            });
        }
    }

    setData(prev => ({
      ...prev,
      status: newStage,
      history: [...prev.history, {
        timestamp: prev.currentSimulatedDate,
        realTimestamp: new Date().toISOString(),
        stage: newStage,
        note: actionLabel
      }]
    }));
  };

  const advanceTime = (days) => {
    const current = new Date(data.currentSimulatedDate);
    current.setDate(current.getDate() + days);
    setData(prev => ({ ...prev, currentSimulatedDate: current.toISOString() }));
  };

  const resetDemo = () => {
    if (window.heap && typeof window.heap.resetIdentity === 'function') window.heap.resetIdentity(); 
    localStorage.removeItem('swiftloan_demo_state');
    window.location.reload();
  };

  const renderStage = () => {
    switch (data.status) {
      case STAGES.APPLICATION:
        return <ApplicationForm data={data} updateData={updateData} nextStage={changeStage} identifyUser={identifyUser} />;
      case STAGES.PRE_APPROVAL:
        setTimeout(() => { if (data.status === STAGES.PRE_APPROVAL) changeStage(STAGES.DOCUMENTS, "System Ready"); }, 1500);
        return <WaitingRoom title="Analyzing Eligibility..." message="Soft credit check in progress." icon={RefreshCw} />;
      case STAGES.DOCUMENTS:
        return <DocumentsView nextStage={changeStage} />;
      case STAGES.UNDERWRITING:
        return <WaitingRoom title="Underwriting Review" message="Our team is reviewing your documentation." icon={Shield} />;
      case STAGES.APPROVAL_OFFER:
        return <OfferReview data={data} nextStage={changeStage} />;
      case STAGES.CLOSING:
        return <ClosingView nextStage={changeStage} />;
      case STAGES.DISBURSED:
        return <SuccessView />;
      case STAGES.DISQUALIFIED:
        return <DisqualifiedView />;
      default: return <div>Unknown Stage</div>;
    }
  };

  const progressIndex = STAGE_ORDER.indexOf(data.status);

  return (
    <div className="min-h-screen bg-slate-100 font-sans flex flex-col md:flex-row">
      {showAdmin && (
        <aside className="w-full md:w-80 bg-slate-900 text-slate-300 flex-shrink-0 flex flex-col h-screen sticky top-0 overflow-y-auto border-r border-slate-800 shadow-2xl z-50">
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center gap-2 text-white font-bold text-xl mb-1">
              <Database size={20} className="text-blue-500" />
              <span>Data Layer</span>
            </div>
            <p className="text-xs text-slate-500">Analytics Simulator</p>
          </div>
          <div className="p-6 space-y-8 flex-1">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                <Clock size={14} /> Time Travel
              </h3>
              <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                <div className="text-sm text-white mb-2 font-mono">
                  {new Date(data.currentSimulatedDate).toLocaleDateString()}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="admin" onClick={() => advanceTime(1)}>+1 Day</Button>
                  <Button variant="admin" onClick={() => advanceTime(5)}>+5 Days</Button>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                <Settings size={14} /> Server Actions
              </h3>
              <div className="space-y-2">
                <Button variant="admin" className="w-full justify-start" onClick={() => changeStage(STAGES.UNDERWRITING, "Admin Force: Underwriting")}>Force Underwriting</Button>
                <Button variant="admin" className="w-full justify-start" onClick={() => changeStage(STAGES.APPROVAL_OFFER, "Admin Force: Approved")}>Force: Server Approves</Button>
                <Button variant="admin" className="w-full justify-start text-red-300 hover:bg-red-900" onClick={resetDemo}><RefreshCw size={14} /> Reset Demo</Button>
              </div>
            </div>
          </div>
        </aside>
      )}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="bg-white shadow-sm z-40 px-8 py-4 flex justify-between items-center sticky top-0">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-lg"><DollarSign size={24} /></div>
            <div><h1 className="text-xl font-bold text-gray-900">SwiftLoan</h1></div>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-gray-500">ID: {data.id}</p>
            <Badge status={data.status} />
          </div>
        </header>
        <div className="px-8 py-6 bg-white border-b border-gray-200">
          <div className="flex items-center w-full max-w-3xl mx-auto">
            {STAGE_ORDER.map((stage, index) => (
              <div key={stage} className="flex items-center flex-1 last:flex-none">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${index <= progressIndex ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-400'}`}>
                    {index < progressIndex ? <CheckCircle size={14}/> : index + 1}
                </div>
                {index !== STAGE_ORDER.length - 1 && <div className={`h-1 flex-1 mx-2 ${index < progressIndex ? 'bg-blue-600' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 p-8 max-w-4xl mx-auto w-full">
          {renderStage()}
          <div className="mt-12 p-4 bg-blue-50 rounded border border-blue-100 text-sm text-blue-800">
             <h4 className="font-bold flex items-center gap-2 mb-2"><Briefcase size={16} /> Automation Context</h4>
             <ul className="list-disc pl-5 opacity-80">
                <li>Simulate time passing to test drop-off analytics.</li>
                <li>Server events are triggered via the "Force: Server Approves" button.</li>
             </ul>
          </div>
        </div>
      </main>
    </div>
  );
}