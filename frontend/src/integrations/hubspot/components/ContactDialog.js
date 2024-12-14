import { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Grid,
    CircularProgress
} from '@mui/material';
import { createContact, updateContact } from '../utils/api';

const ContactDialog = ({ 
    open, 
    onClose, 
    contact = null, 
    credentials,
    onSuccess 
}) => {
    const isEdit = Boolean(contact);
    const [isSubmitting, setIsSubmitting] = useState(false);
    // const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        firstname: contact?.firstname || '',
        lastname: contact?.lastname || '',
        email: contact?.email || '',
        phone: contact?.phone || '',
        company: contact?.company || '',
        notes: contact?.notes || ''
    });

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError(null);

        try {
            if (isEdit) {
                await updateContact({
                    credentials,
                    contactId: contact.id,
                    contactData: formData,
                    setError
                });
            } else {
                await createContact({
                    credentials,
                    contactData: formData,
                    setError
                });
            }
            onSuccess();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                {isEdit ? 'Edit Contact' : 'Create New Contact'}
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={6}>
                        <TextField
                            fullWidth
                            label="First Name"
                            value={formData.firstname}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                firstname: e.target.value
                            }))}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField
                            fullWidth
                            label="Last Name"
                            value={formData.lastname}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                lastname: e.target.value
                            }))}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                email: e.target.value
                            }))}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField
                            fullWidth
                            label="Phone"
                            value={formData.phone}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                phone: e.target.value
                            }))}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField
                            fullWidth
                            label="Company"
                            value={formData.company}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                company: e.target.value
                            }))}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Notes"
                            multiline
                            rows={4}
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                notes: e.target.value
                            }))}
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button 
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={isSubmitting}
                    startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
                >
                    {isEdit ? 'Save Changes' : 'Create Contact'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ContactDialog;