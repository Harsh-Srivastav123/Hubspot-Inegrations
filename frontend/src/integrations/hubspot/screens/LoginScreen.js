import { Box, Button, CircularProgress, Alert } from '@mui/material';
import { handleConnect } from '../utils/api';

const LoginScreen = ({ 
    user, 
    org, 
    isConnecting, 
    setIsConnecting, 
    setIntegrationParams,
    error,
    setError 
}) => {
    const onConnect = () => handleConnect({
        user,
        org,
        setIsConnecting,
        setIntegrationParams,
        setError
    });

    return (
        <Box sx={{ mt: 2 }}>
            <Box display='flex' alignItems='center' justifyContent='center' sx={{ mt: 2 }}>
                <Button 
                    variant='contained' 
                    onClick={onConnect}
                    disabled={isConnecting}
                    color="primary"
                >
                    {isConnecting ? <CircularProgress size={20} /> : 'Connect to HubSpot'}
                </Button>
            </Box>
            {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                </Alert>
            )}
        </Box>
    );
};

export default LoginScreen;