/*
 * Copyright (c) 2021 Karl Li. All rights reserved.
 */
import React from 'react';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';

const durations = [
    {
        value: 15,
        label: '15 minutes',
    },
    {
        value: 30,
        label: '30 minutes',
    },
    {
        value: 45,
        label: '45 minutes',
    },
    {
        value: 60,
        label: '60 minutes',
    },
    {
        value: 90,
        label: '90 minutes',
    },
    {
        value: 120,
        label: '2 hours',
    },
    {
        value: 180,
        label: '3 hours',
    },
    {
        value: 240,
        label: '4 hours',
    },
    {
        value: 300,
        label: '5 hours',
    },
];

class PostMessageForm extends React.Component {
    constructor(props) {
        super(props);

        let title = '';
        let message = '';
        let category = 'General';
        let eventTime = '';
        let duration = 60;

        const messageToEdit = this.props.messageToEdit;
        if (messageToEdit) {
            title = messageToEdit.title;
            message = messageToEdit.body;
            category = messageToEdit.category;
            if (messageToEdit.startTime && messageToEdit.endTime) {
                const start = new Date(messageToEdit.startTime);
                const end = new Date(messageToEdit.endTime);
                eventTime = new Date(start.getTime() - (start.getTimezoneOffset() * 60000)).toISOString().slice(0, 19);
                duration = (end - start) / 60000;
            }
        }

        this.state = {
            title: title,
            message: message,
            category: category,
            eventTime: eventTime,
            duration: duration
         };
    }

    onTitleChange = (event) => {
        this.setState({ title: event.target.value });
    }

    onMessageChange = (event) => {
        this.setState({ message: event.target.value });
    }

    onCategoryChange = (event) => {
        this.setState({ category: event.target.value });
    }

    onEventTimeChange = (event) => {
        this.setState({ eventTime: event.target.value });
    }

    onDurationChange = (event) => {
        this.setState({ duration: event.target.value });
    }

    isFormValid = () => {
        const { title, message, category } = this.state;
        return title && message && category;
    }

    onSubmit = (event) => {
        event.preventDefault();
        const messageToEdit = this.props.messageToEdit;
        const id = messageToEdit ? messageToEdit.id : 0;
        const method = messageToEdit ? 'PUT' : 'POST';
        const { title, message, category, eventTime, duration } = this.state;

        let startTime = null;
        let endTime = null;
        if (eventTime) {
            startTime = new Date(eventTime);
            endTime = new Date(startTime.getTime() + duration * 60 * 1000);
        }

        this.props.upsertMessage(id, title, message, category, startTime, endTime, method);
    }

    onCancel = (event) => {
        event.preventDefault();
        this.props.cancelPost();
    }
  
    render() {
        const { title, message, category, eventTime, duration } = this.state;
        return (
        <form onSubmit={this.onSubmit} onCancel={this.onCancel}>
            <Grid container direction={"column"} spacing={2} sx={{ marginTop: 1 }}>
                <Grid item>
                    <TextField name="title"
                        onBlur={this.onTitleChange}
                        onChange={this.onTitleChange}
                        label="Title"
                        value={title}
                        fullWidth
                        autoComplete="none" />
                </Grid>
                <Grid item>
                    <TextField name="category"
                        onBlur={this.onCategoryChange}
                        onChange={this.onCategoryChange}
                        label="Category"
                        value={category}
                        fullWidth
                        autoComplete="none" />
                </Grid>
                <Grid item>
                    <TextField name="eventTime"
                        onBlur={this.onEventTimeChange}
                        onChange={this.onEventTimeChange}
                        label="Optional event time"
                        type="datetime-local"
                        defaultValue={eventTime}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                        autoComplete="none" />
                </Grid>
                <Grid item>
                    <TextField name="duration"
                        select
                        onBlur={this.onDurationChange}
                        onChange={this.onDurationChange}
                        label="Optional event duration"
                        fullWidth
                        value={duration}>
                            {durations.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                    </TextField>
                </Grid>
                <Grid item>
                    <TextField name="message"
                        onBlur={this.onMessageChange}
                        onChange={this.onMessageChange}
                        label="Message"
                        value={message}
                        fullWidth
                        multiline
                        rows={5}
                        autoComplete="none" />
                    <Button type="submit" disabled={!this.isFormValid()}>Submit</Button>   
                    <Button type="button" onClick={this.onCancel}>Cancel</Button>
                </Grid>
            </Grid>
        </form>
        );
    }
}

export default PostMessageForm;