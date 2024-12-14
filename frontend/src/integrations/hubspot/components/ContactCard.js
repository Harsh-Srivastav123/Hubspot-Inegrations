import { useState } from 'react';
import {
    Card,
    CardContent,
    CardActions,
    Typography,
    Box,
    Avatar,
    IconButton,
    Collapse,
    Tooltip
} from '@mui/material';
import {
    Person as PersonIcon,
    Business as BusinessIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { formatContactName, formatPhoneNumber, formatDate } from '../utils/helpers';
import FileUploader from './FileUploader';

const ContactCard = ({ 
    contact, 
    credentials, 
    onEdit, 
    onDelete 
}) => {
    const [expanded, setExpanded] = useState(false);

    // Add null checks and default values
    const formattedName = formatContactName({
        firstName: contact?.firstName || '',
        lastName: contact?.lastName || ''
    });
    
    const formattedPhone = formatPhoneNumber(contact?.phone || '');
    const lastModified = formatDate(contact?.lastModifiedDate || '');

    if (!contact) return null;

    return (
        <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent>
                <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
                    <Avatar sx={{ bgcolor: '#ff7a59', mr: 2 }}>
                        {formattedName.charAt(0)}
                    </Avatar>
                    <Box>
                        <Typography variant="h6" noWrap>
                            {formattedName || 'No Name'}
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
                            href={contact?.phone ? `tel:${contact.phone}` : undefined}
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