import {
    Business as BusinessIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Email as EmailIcon,
    ExpandMore as ExpandMoreIcon,
    Phone as PhoneIcon
} from '@mui/icons-material';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import {
    Avatar,
    Box,
    Card,
    CardActions,
    CardContent,
    IconButton,
    Tooltip,
    Typography
} from '@mui/material';
import { useState } from 'react';
import { formatContactName, formatDate, formatPhoneNumber } from '../utils/helpers';
import { getGptResponse } from '../utils/api';

const ContactCard = ({ 
    contact, 
    credentials, 
    onEdit, 
    onDelete 
}) => {
    const [expanded, setExpanded] = useState(false);

    console.log('SINGLE CONTACT --> ', contact)

    // Add null checks and default values
    const formattedName = formatContactName({
        firstName: contact?.name || '',
    });
    
    const formattedPhone = formatPhoneNumber(contact?.mobile || '');
    const lastModified = formatDate(contact?.lastModifiedDate || '');

    if (!contact) return null;


    const aiResponseHandler = (contact) => {
        getGptResponse({credentials, contactId: contact.id});
    }

    return (
        <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent>
                <button onClick={() => aiResponseHandler(contact)}><TipsAndUpdatesIcon /></button>
                <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
                    <Avatar sx={{ bgcolor: '#ff7a59', mr: 2 }}>
                        {formattedName.charAt(0)}
                    </Avatar>
                    <Box>
                        <Typography variant="h6" noWrap>
                            {contact.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Last modified: {lastModified || 'N/A'}
                        </Typography>
                    </Box>
                </Box>
                
                <Box sx={{ mt: 2 }}>
                    <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
                        <BusinessIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" noWrap>
                            {contact?.company || 'No Company'}
                        </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
                        <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography 
                            variant="body2" 
                            noWrap
                            component="a"
                            href={contact?.email ? `mailto:${contact.email}` : undefined}
                            sx={{ 
                                color: contact?.email ? 'primary.main' : 'text.secondary',
                                textDecoration: 'none',
                                '&:hover': {
                                    textDecoration: contact?.email ? 'underline' : 'none'
                                }
                            }}
                        >
                            {contact?.email || 'No Email'}
                        </Typography>
                    </Box>
                    <Box display="flex" alignItems="center">
                        <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography 
                            variant="body2" 
                            noWrap
                            component="a"
                            href={contact?.mobile ? `tel:${contact.phone}` : undefined}
                            sx={{ 
                                color: contact?.phone ? 'primary.main' : 'text.secondary',
                                textDecoration: 'none',
                                '&:hover': {
                                    textDecoration: contact?.phone ? 'underline' : 'none'
                                }
                            }}
                        >
                            {formattedPhone || 'No Phone'}
                        </Typography>
                    </Box>
                </Box>
            </CardContent>
            
            <Box sx={{ mt: 'auto' }}>
                <CardActions disableSpacing>
                    <Tooltip title="Edit contact">
                        <IconButton 
                            onClick={() => onEdit(contact)}
                            size="small"
                            color="primary"
                        >
                            <EditIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete contact">
                        <IconButton 
                            onClick={() => onDelete(contact.id)}
                            size="small"
                            color="error"
                        >
                            <DeleteIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={expanded ? "Show less" : "Show more"}>
                        <IconButton
                            onClick={() => setExpanded(!expanded)}
                            sx={{
                                marginLeft: 'auto',
                                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.3s'
                            }}
                            size="small"
                        >
                            <ExpandMoreIcon />
                        </IconButton>
                    </Tooltip>
                </CardActions>

                {/* <Collapse in={expanded}>
                    <CardContent>
                        <Typography variant="subtitle2" gutterBottom>
                            Files & Attachments
                        </Typography>
                        <FileUploader 
                            contactId={contact.id}
                            credentials={credentials}
                        />
                    </CardContent>
                </Collapse> */}
            </Box>
        </Card>
    );
};

export default ContactCard;