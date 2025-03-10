import React, { useEffect, useState } from 'react';
import { InteractiveBrowserCredential, AzureCliCredential } from "@azure/identity";
import { SubscriptionClient } from "@azure/arm-subscriptions";

interface DropdownProps {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}

const Dropdown: React.FC<DropdownProps> = ({ label, options, value, onChange }) => (
  <div>
    <label>{label}: </label>
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Select...</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </div>
);

const App: React.FC = () => {
  const [data, setData] = useState<string[] | null>(null);
  const [subscription, setSubscription] = useState('');
  const [resourceGroup, setResourceGroup] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [resourceName, setResourceName] = useState('');
  const [banner, setBanner] = useState('');
  const handleStart = () => {
    setBanner('Operation submitted successfully');
  };

    // Define your async function
    const fetchData = async () => {
      try{
          const subscriptionNames = await getAzureSubscriptionNames();
          console.log(subscriptionNames);
          setData(subscriptionNames);
      } catch(error) {
          console.error(error);
      }
    };

    useEffect(() => {
        fetchData();
    }, []); // Empty dependency array means this useEffect runs only once when the component mounts.

  return (
    
    
    
    <div>
    {data ? <div>Data: Loaded.</div> : <div>Loading...</div>}
      <Dropdown
        label="Azure Subscription"
        options= {data ? data : [] as string[]}
        value={subscription}
        onChange={setSubscription}
      />
      <Dropdown
        label="Azure Resource Group"
        options={['RG1', 'RG2', 'RG3']}
        value={resourceGroup}
        onChange={setResourceGroup}
      />
      <Dropdown
        label="Azure Resource Type"
        options={['VM', 'Storage', 'Network']}
        value={resourceType}
        onChange={setResourceType}
      />
      <Dropdown
        label="Azure Resource Name"
        options={['Resource1', 'Resource2', 'Resource3']}
        value={resourceName}
        onChange={setResourceName}
      />
      <button style={{ backgroundColor: 'green', color: 'white' }} onClick={handleStart}>
        Start
      </button>
      {banner && <div style={{ marginTop: '20px', color: 'green' }}>{banner}</div>}
    </div>
  );
};

async function getAzureSubscriptionNames(): Promise<string[]> {
  try {
    const options =  {
      clientId: "5e6371ce-dcb9-4a61-8aec-abe5c2d3bac6",
      tenantId: "1f4c33e1-e960-43bf-a135-6db8b82b6885", // Replace with your Azure tenant ID if applicable
      redirectUri: "http://localhost:3000"
    }
      
    // Create a DefaultAzureCredential. This will use the logged-in user's credentials.
    const credential = new InteractiveBrowserCredential(options);
    //const credential = new AzureCliCredential();

    // Create a SubscriptionClient using the credential
    const subscriptionClient = new SubscriptionClient(credential);

    // List all subscriptions
    const subscriptions = subscriptionClient.subscriptions.list();

    // Array to store subscription names
    const subscriptionNames: string[] = [];

    // Iterate through subscriptions and add names to the array
    for await (const subscription of subscriptions) {
      if (subscription.displayName) {
        subscriptionNames.push(subscription.displayName);
      }
    }

    return subscriptionNames;
  } catch (error) {
    console.error("An error occurred while listing subscriptions:", error);
    return [];
  }
}

export default App;