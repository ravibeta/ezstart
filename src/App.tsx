import React, { useEffect, useState } from 'react';
import { InteractiveBrowserCredential } from "@azure/identity";
import { SubscriptionClient } from "@azure/arm-subscriptions";
import { ResourceManagementClient } from "@azure/arm-resources";

interface DropdownProps {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}

interface IdName {
  id: string | undefined;
  name: string | undefined;
};


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
  const [data, setData] = useState<IdName[] | null>(null);
  const [rgs, setRgs] = useState<string[] | null>(null);
  const [subscription, setSubscription] = useState('');
  const [resourceGroup, setResourceGroup] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [resourceName, setResourceName] = useState('');
  const [banner, setBanner] = useState('');

  const handleStart = () => {
    setBanner('Operation submitted successfully');
  };

  function getSubscriptionNames(subscriptionIdNames: IdName[]): string[] {
    return subscriptionIdNames.map(sub => sub.name).filter(name => name !== undefined) as string[];
  }

  function getSubscriptionIdByName(subscriptionIdNames: IdName[], name: string): string | undefined {
    const subscriptionIdName = subscriptionIdNames.find(sub => sub.name === name);
    return subscriptionIdName ? subscriptionIdName.id : undefined;
  }

  const fetchData = async () => {
    try {
      const subscriptionIdNames = await getAzureSubscriptionNames();
      console.log(subscriptionIdNames);
      setData(subscriptionIdNames);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchResourceGroups = async (subscriptionId: string) => {
    try {
      const resourceGroupNames = await getResourceGroupNames(subscriptionId);
      console.log(resourceGroupNames);
      setRgs(resourceGroupNames);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (data && subscription) {
      const subscriptionId = getSubscriptionIdByName(data, subscription);
      if (subscriptionId) {
        console.log(subscriptionId);
        fetchResourceGroups(subscriptionId?.valueOf());
      }
    }
  }, [data, subscription]);

  // onChange function
  const subscriptionDropdownChange = (selectedValue: string) => {
    setSubscription(selectedValue);
  };

  return (
    <div>
      <Dropdown
        label="Subscription"
        options={data ? getSubscriptionNames(data) : []}
        value={subscription}
        onChange={subscriptionDropdownChange}
      />
      <Dropdown
        label="Resource Group"
        options={rgs || []}
        value={resourceGroup}
        onChange={setResourceGroup}
      />
      <Dropdown
        label="Resource Type"
        options={["Web App", "Kubernetes Cluster"]}
        value={resourceType}
        onChange={setResourceType}
      />
      <Dropdown
        label="Resource Name"
        options={data ? getSubscriptionNames(data) : []}
        value={resourceName}
        onChange={setResourceName}
      />
      <button onClick={handleStart}>Start</button>
      {banner && <p>{banner}</p>}
    </div>
  );
};

async function getAzureSubscriptionNames(): Promise<IdName[]> {
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
    const subscriptionIdNames: IdName[] = [];

    // Iterate through subscriptions and add names to the array
    for await (const subscription of subscriptions) {
      if (subscription.displayName) {
        subscriptionIdNames.push({id: subscription.subscriptionId, name: subscription.displayName});
      }
    }

    return subscriptionIdNames;
  } catch (error) {
    console.error("An error occurred while listing subscriptions:", error);
    return [];
  }
}

async function getResourceGroupNames(subscriptionId: string): Promise<string[]> {
  try {
    const options = {
      clientId: "5e6371ce-dcb9-4a61-8aec-abe5c2d3bac6",
      tenantId: "1f4c33e1-e960-43bf-a135-6db8b82b6885", // Replace with your Azure tenant ID if applicable
      redirectUri: "http://localhost:3000"
    }

    // Create a DefaultAzureCredential. This will use the logged-in user's credentials.
    const credential = new InteractiveBrowserCredential(options);
    //const credential = new AzureCliCredential();

    // Create a ResourceManagementClient using the credential and subscription ID
    const resourceClient = new ResourceManagementClient(credential, subscriptionId);

    // List all resource groups
    const resourceGroups = resourceClient.resourceGroups.list();

    // Array to store resource group names
    const resourceGroupNames: string[] = [];

    // Iterate through resource groups and add names to the array
    for await (const resourceGroup of resourceGroups) {
      if (resourceGroup.name) {
        resourceGroupNames.push(resourceGroup.name);
      }
    }

    return resourceGroupNames;
  } catch (error) {
    console.error("An error occurred while listing resource groups:", error);
    return [];
  }
}

/**
 * Set a GitHub repository secret.
 * @param owner - The owner of the repository.
 * @param repo - The repository name.
 * @param secretName - The name of the secret.
 * @param secretValue - The value of the secret.
 * @param token - The Personal Access Token (PAT) with `repo` or `actions` scope.
 */
export const setGitHubSecret = async (
  owner: string,
  repo: string,
  secretName: string,
  secretValue: string,
  token: string
): Promise<void> => {
  try {
    // Step 1: Get the public key of the repository
    const publicKeyResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/secrets/public-key`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
      }
    );

    if (!publicKeyResponse.ok) {
      throw new Error(`Failed to fetch public key: ${publicKeyResponse.statusText}`);
    }

    const publicKeyData = await publicKeyResponse.json();
    const { key, key_id } = publicKeyData;

    // Step 2: Encrypt the secret value
    const secretBytes = new TextEncoder().encode(secretValue);
    const keyBuffer = Buffer.from(key, "base64");

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyBuffer,
      { name: "RSA-OAEP", hash: "SHA-256" },
      false,
      ["encrypt"]
    );

    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      cryptoKey,
      secretBytes
    );

    // Convert encrypted result to Base64 string
    const encryptedSecret = Buffer.from(new Uint8Array(encryptedBuffer)).toString("base64");

    // Step 3: Set the secret in the repository
    const setSecretResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/secrets/${secretName}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          encrypted_value: encryptedSecret,
          key_id: key_id,
        }),
      }
    );

    if (!setSecretResponse.ok) {
      throw new Error(`Failed to set secret: ${setSecretResponse.statusText}`);
    }

    console.log(`Secret '${secretName}' has been set successfully!`);
  } catch (error) {
    console.error("Error setting GitHub secret:", error);
  }
};

/**
 * Trigger a GitHub Workflow Dispatch Event.
 * @param owner - The owner of the repository.
 * @param repo - The repository name.
 * @param workflowFileName - The name of the workflow file (e.g., "ci.yml").
 * @param ref - The branch or tag to run the workflow on (e.g., "main").
 * @param inputs - Optional inputs to pass to the workflow (if configured).
 * @param token - The Personal Access Token (PAT) with `repo` or `workflow` scope.
 */
export const triggerWorkflowDispatch = async (
  owner: string,
  repo: string,
  workflowFileName: string,
  ref: string,
  inputs: Record<string, string> = {},
  token: string
): Promise<void> => {
  try {
    // API endpoint for triggering the workflow
    const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFileName}/dispatches`;

    // Send the POST request to trigger the workflow
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ref,
        inputs, // Optional inputs for the workflow
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to trigger workflow: ${response.statusText}`);
    }

    console.log(`Workflow '${workflowFileName}' triggered successfully on ref '${ref}'!`);
  } catch (error) {
    console.error("Error triggering GitHub workflow:", error);
  }
};

export default App;