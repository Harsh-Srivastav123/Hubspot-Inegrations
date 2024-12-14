import { useState, useRef, useEffect } from 'react';
import {
    Box,
    Button,
    Typography,
    LinearProgress,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemSecondaryAction,
    IconButton
} from '@mui/material';
import {
    CloudUpload as UploadIcon,
    AttachFile as FileIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import { uploadContactFile, getContactFiles } from '../utils/api';

const FileUploader = ({ contactId, credentials }) => {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);
    const fileInputRef = useRef();

    const loadFiles = async () => {
        try {
            const response = await getContactFiles({
                credentials,
                contactId,
                setError
            });
            if (Array.isArray(response)) {
                setFiles(response);
            }
        } catch (err) {
            setError('Failed to load files');
            console.error('File loading error:', err);
        }
    };

    useEffect(() => {
        if (contactId && credentials) {
            loadFiles();
        }
    }, [contactId, credentials, loadFiles]);

    const handleFileSelect = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploading(true);
        setProgress(0);
        setError(null);

        try {
            await uploadContactFile({
                credentials,
                contactId,
                file,
                setError,
                onProgress: (progress) => setProgress(progress)
            });
            await loadFiles();
        } catch (err) {
            setError('Failed to upload file');
            console.error('Upload error:', err);
        } finally {
            setUploading(false);
            setProgress(0);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <Box>
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileSelect}
            />
            
            <Button
                fullWidth
                variant="outlined"
                startIcon={<UploadIcon />}
                onClick={() => fileInputRef.current.click()}
                disabled={uploading}
                sx={{ mb: 2 }}
            >
                Upload File
            </Button>

            {uploading && (
                <Box sx={{ mb: 2 }}>
                    <LinearProgress 
                        variant="determinate" 
                        value={progress} 
                    />
                    <Typography variant="caption" color="textSecondary">
                        Uploading: {progress}%
                    </Typography>
                </Box>
            )}

            <List>
                {files.map((file) => (
                    <ListItem key={file.id}>
                        <ListItemIcon>
                            <FileIcon />
                        </ListItemIcon>
                        <ListItemText
                            primary={file.name}
                            secondary={`${file.size} bytes`}
                        />
                        <ListItemSecondaryAction>
                            <IconButton edge="end" aria-label="delete">
                                <DeleteIcon />
                            </IconButton>
                        </ListItemSecondaryAction>
                    </ListItem>
                ))}
            </List>
        </Box>
    );
};

export default FileUploader;