import { useState } from 'react';
import {
    Box,
    TextField,
    InputAdornment,
    IconButton,
    Popover,
    Paper,
    Typography,
    Divider,
    FormControl,
    FormGroup,
    FormControlLabel,
    Checkbox
} from '@mui/material';
import {
    Search as SearchIcon,
    FilterList as FilterIcon,
    Clear as ClearIcon
} from '@mui/icons-material';

const SearchBar = ({ 
    value, 
    onChange,
    onFilterChange,
    filters = {}
}) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [localFilters, setLocalFilters] = useState(filters);

    const handleFilterClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleFilterClose = () => {
        setAnchorEl(null);
        if (onFilterChange) {
            onFilterChange(localFilters);
        }
    };

    const handleFilterChange = (key, value) => {
        setLocalFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    return (
        <Box sx={{ width: '100%', maxWidth: 600 }}>
            <TextField
                fullWidth
                placeholder="Search contacts..."
                value={value}
                onChange={(e) => onChange(e.target.value)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon />
                        </InputAdornment>
                    ),
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton 
                                onClick={handleFilterClick}
                                size="small"
                            >
                                <FilterIcon />
                            </IconButton>
                            {value && (
                                <IconButton
                                    onClick={() => onChange('')}
                                    size="small"
                                >
                                    <ClearIcon />
                                </IconButton>
                            )}
                        </InputAdornment>
                    )
                }}
                sx={{
                    backgroundColor: 'white',
                    borderRadius: 1,
                    '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                            borderColor: 'rgba(0, 0, 0, 0.23)',
                        },
                        '&:hover fieldset': {
                            borderColor: 'rgba(0, 0, 0, 0.87)',
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: '#ff7a59',
                        },
                    },
                }}
            />

            <Popover
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                onClose={handleFilterClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
            >
                <Paper sx={{ p: 2, minWidth: 300 }}>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                        Filters
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <FormControl component="fieldset">
                        <FormGroup>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={localFilters.hasEmail}
                                        onChange={(e) => handleFilterChange(
                                            'hasEmail',
                                            e.target.checked
                                        )}
                                    />
                                }
                                label="Has Email"
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={localFilters.hasPhone}
                                        onChange={(e) => handleFilterChange(
                                            'hasPhone',
                                            e.target.checked
                                        )}
                                    />
                                }
                                label="Has Phone"
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={localFilters.hasCompany}
                                        onChange={(e) => handleFilterChange(
                                            'hasCompany',
                                            e.target.checked
                                        )}
                                    />
                                }
                                label="Has Company"
                            />
                        </FormGroup>
                    </FormControl>
                </Paper>
            </Popover>
        </Box>
    );
};

export default SearchBar;