import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import Container from '@mui/material/Container';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';

const ResponsiveAppBar = (props) => {
    const [anchorElUser, setAnchorElUser] = React.useState(null);

    const onOpenUserMenu = (event) => {
        setAnchorElUser(event.currentTarget);
    };

    const onCloseUserMenu = () => {
        setAnchorElUser(null);
    }

    const onRefreshMenu = () => {
        props.handleRefresh();
        setAnchorElUser(null);
    };

    const onPostMenu = () => {
        props.handlePost();
        setAnchorElUser(null);
    };

    const onFilterMenu = () => {
        props.handleFilter();
        setAnchorElUser(null);
    };

    const onLogoutMenu = (event) => {
        fetch(`/api/logout`, {method: 'POST'})
            .then(
                (result) => {
                    window.location.href = "/signin.html";
                },
                (error) => {
                    console.log(error);
                }
            )
        setAnchorElUser(null);
    };

    return (
        <AppBar position="static">
            <Container maxWidth="xl">
                <Toolbar disableGutters>
                    <Typography
                        variant="h5"
                        noWrap
                        component="a"
                        href=""
                        sx={{
                            mr: 2,
                            display: 'flex',
                            flexGrow: 1,
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            letterSpacing: '.3rem',
                            color: 'inherit',
                            textDecoration: 'none',
                        }}
                    >
                        SSBB
                    </Typography>

                    <Box sx={{ flexGrow: 0 }}>
                        <Tooltip title="Open menu">
                            <IconButton onClick={onOpenUserMenu} sx={{ p: 0 }}>
                                <Avatar alt={props.me.name} src={props.me.pictureUrl} />
                            </IconButton>
                        </Tooltip>
                        <Menu
                            sx={{ mt: '45px' }}
                            id="menu-appbar"
                            anchorEl={anchorElUser}
                            anchorOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            keepMounted
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            open={Boolean(anchorElUser)}
                            onClose={onCloseUserMenu}
                        >
                            <MenuItem key={"Post"} onClick={onPostMenu}>
                                <Typography textAlign="center">Post</Typography>
                            </MenuItem>
                            <MenuItem key={"Filter"} onClick={onFilterMenu}>
                                <Typography textAlign="center">Filter</Typography>
                            </MenuItem>
                            <MenuItem key={"Refresh"} onClick={onRefreshMenu}>
                                <Typography textAlign="center">Refresh</Typography>
                            </MenuItem>
                            <MenuItem key={"Logout"} onClick={onLogoutMenu}>
                                <Typography textAlign="center">Logout</Typography>
                            </MenuItem>
                        </Menu>
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
    );
};
export default ResponsiveAppBar;
