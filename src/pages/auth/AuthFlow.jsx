import { useState } from 'react';
import WorkspaceEntry from './WorkspaceEntry';
import AccessChoice from './AccessChoice';
import CreateAffiliateAccount from './CreateAffiliateAccount';
import AffiliateSignIn from './AffiliateSignIn';
import AdminSignIn from './AdminSignIn';

export default function AuthFlow() {
  const [step, setStep] = useState('workspace');
  const [workspaceName, setWorkspaceName] = useState('');

  if (step === 'workspace') {
    return (
      <WorkspaceEntry
        onContinue={(name) => {
          setWorkspaceName(name);
          setStep('access');
        }}
      />
    );
  }

  if (step === 'access') {
    return (
      <AccessChoice
        workspaceName={workspaceName}
        onPick={(next) => setStep(next)}
        onBack={() => setStep('workspace')}
      />
    );
  }

  if (step === 'create') {
    return (
      <CreateAffiliateAccount
        onGoAffiliateSignIn={() => setStep('affiliate')}
        onGoAdminSignIn={() => setStep('admin')}
      />
    );
  }

  if (step === 'affiliate') {
    return (
      <AffiliateSignIn
        onGoCreate={() => setStep('create')}
        onGoAdminSignIn={() => setStep('admin')}
      />
    );
  }

  return <AdminSignIn onBack={() => setStep('access')} />;
}
