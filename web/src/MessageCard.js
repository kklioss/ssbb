/*
 * Copyright (c) 2021 Karl Li. All rights reserved.
 */
import * as React from 'react';
import { styled } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { red } from '@mui/material/colors';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import QuickreplyIcon from '@mui/icons-material/Quickreply';
import ReplyMessageForm from './ReplyMessageForm';

const dateStringOptions = {
    day: 'numeric',
    month: 'short'
}

const timeStringOptions = {
  hour: '2-digit',
  minute: '2-digit'
}

function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleTimeString([], timeStringOptions) + ', ' + d.toLocaleDateString([], dateStringOptions);
}

function formatEventTime(startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return 'Event Time: ' + start.toLocaleTimeString([], timeStringOptions).slice(0, -3) + ' - ' +
        end.toLocaleTimeString([], timeStringOptions) + ', ' + start.toLocaleDateString([], dateStringOptions);
}

function PosterButtons(props) {
    if (props.message.createdBy === props.me.id || props.roles.includes("admin")) {
        return (
            <Box>
            <IconButton aria-label="edit" onClick={() => props.editMessage(props.message)}>
                <EditIcon />
            </IconButton>
            <IconButton aria-label="delete" onClick={() => props.deleteMessage(props.message)}>
                <DeleteIcon color="action" />
            </IconButton>
            </Box>
        );
    }

    return null;
}

function ReplyBox(props) {
    const response = props.response;
    const user = props.user ? props.user : {name: "Unknown User"};
    return (
        <Box sx={{
            width: "90%",
            border: "0.5px solid black",
            borderRadius: "10px",
            margin: "5px",
            padding: "10px",
            display: "inline-block"
        }}>
            <CardHeader
                avatar={
                    <Avatar sx={{ bgcolor: red[500] }} alter={user.name} src={user.pictureUrl} />
                }
                title={user.name}
                subheader={formatDate(response.createdAt)}
            />
            <CardContent>
                <Typography variant="body2" color="text.secondary" style={{ whiteSpace: 'pre-wrap' }}>
                    {response.reply}
                </Typography>
            </CardContent>
        </Box >
    );
}

const ExpandMore = styled((props) => {
    const { expand, ...other } = props;
    return <IconButton {...other} />;
})(({ theme, expand }) => ({
    transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
    marginLeft: 'auto',
    transition: theme.transitions.create('transform', {
        duration: theme.transitions.duration.shortest,
    }),
}));

function MessageBody(props) {
    const [expanded, setExpanded] = React.useState(false);

    const handleExpandClick = () => {
        setExpanded(!expanded);
    };

    if (expanded) {
        return (
            <CardContent>
                <Typography onClick={handleExpandClick} component="span" variant="body2" color="text.secondary" style={{ whiteSpace: 'pre-wrap' }}>
                    {props.message}
                </Typography>
            </CardContent>
        );
    } else {
        return (
            <CardContent>
                <Typography onClick={handleExpandClick} component="span" variant="body2" color="text.secondary" style={{ whiteSpace: 'pre-wrap' }}
                    sx={{
                        display: '-webkit-box',
                        overflow: 'hidden',
                        WebkitBoxOrient: 'vertical',
                        WebkitLineClamp: 8
                    }}>
                    {props.message}
                </Typography>
            </CardContent>
        );
    }
}

export default function MessageCard(props) {
    const [expanded, setExpanded] = React.useState(false);
    const [replyMode, setReplyMode] = React.useState(false);
    const [responses, setResponse] = React.useState([]);

    const handleExpandClick = () => {
        if (!expanded && responses.length === 0) {
            fetchResponses(props.message.id);
        }
        setExpanded(!expanded);
    };

    const fetchResponses = (messageId) => {
        console.log(`fetch responses to message ${messageId}`);

        fetch(`api/responses/${messageId}`)
            .then(res => res.json())
            .then(
                (result) => {
                    setResponse(result);
                },
                // Note: it's important to handle errors here
                // instead of a catch() block so that we don't swallow
                // exceptions from actual bugs in components.
                (error) => {
                    console.log(error);
                }
            )
    }

    let message = props.message.body;
    if (props.message.startTime && props.message.endTime) {
        message = formatEventTime(props.message.startTime, props.message.endTime) + '\n\n' + message;
    }

    return (
        <Card sx={{ width: 390 }}>
            <CardHeader
                avatar={
                    <Avatar sx={{ bgcolor: red[500] }} alter={props.user.name} src={props.user.pictureUrl} />
                }
                title={props.message.title}
                subheader={props.message.category + ' \u00B7 ' + formatDate(props.message.updatedAt)}
            />
            <MessageBody message={message} />
            <CardContent>
                {replyMode &&
                <ReplyMessageForm message={props.message}
                    hideReplyForm={() => setReplyMode(false)} />}
            </CardContent>
            <CardActions disableSpacing>
                <IconButton aria-label="reply" onClick={() => setReplyMode(true)}>
                    <QuickreplyIcon />
                </IconButton>
                <PosterButtons {...props} />
                <ExpandMore
                    expand={expanded}
                    onClick={handleExpandClick}
                    aria-expanded={expanded}
                    aria-label="show more"
                >
                    <ExpandMoreIcon />
                </ExpandMore>
            </CardActions>
            <Collapse in={expanded} timeout="auto" unmountOnExit>
                <CardContent>
                    {responses.map((response) =>
                        <ReplyBox key={response.id} response={response} user={props.getUser(response.userId)} />
                    )}
                </CardContent>
            </Collapse>
        </Card>
    );
}
