import { useState, useEffect } from 'react';
import LoginScreen from './screens/LoginScreen';
import ContactsScreen from './screens/ContactsScreen';
import { checkConnectionStatus } from './utils/api';

export const HubSpotIntegration = ({ user, org, integrationParams, setIntegrationParams }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        setIsConnected(integrationParams?.credentials ? true : false);
    }, [integrationParams]);

    if (!isConnected) {
        return (
            <LoginScreen 
                user={user}
                org={org}
                isConnecting={isConnecting}
                setIsConnecting={setIsConnecting}
                setIntegrationParams={setIntegrationParams}
                error={error}
                setError={setError}
            />
        );
    }

    return (
        <ContactsScreen 
            user={user}
            org={org}
            integrationParams={integrationParams}
            setIntegrationParams={setIntegrationParams}
            setIsConnected={setIsConnected}
        />
    );
};