import React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

class ReplyMessageForm extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            message: ''
        };
    }

    onMessageChange = (event) => {
        this.setState({ message: event.target.value });
    }

    isFormValid = () => {
        return this.state.message;
    }

    onSubmit = (event) => {
        event.preventDefault();

        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(
                {
                    'messageId': this.props.message.id,
                    'reply': this.state.message
                })
        };

        fetch(`/api/response`, requestOptions)
            .then(
                (result) => {
                    this.props.hideReplyForm();
                },
                (error) => {
                    alert(error);
                }
            )
    }

    onCancel = (event) => {
        event.preventDefault();
        this.props.hideReplyForm();
    }

    render() {
        return (
            <form onSubmit={this.onSubmit} onCancel={this.onCancel}>
                <TextField name="reply"
                    onBlur={this.onMessageChange}
                    onChange={this.onMessageChange}
                    label="Reply"
                    fullWidth
                    multiline
                    rows={5}
                    autoComplete="none" />
                <Button type="submit" disabled={!this.isFormValid()}>Submit</Button>
                <Button type="button" onClick={this.onCancel}>Cancel</Button>
            </form>
        );
    }
}

export default ReplyMessageForm;