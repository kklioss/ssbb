import React from 'react';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';

class FilterForm extends React.Component {
    constructor(props) {
        super(props);

        const { sender, category, startDate, endDate } = props.filter;
        this.state = {
            sender: sender,
            category: category,
            startDate: startDate,
            endDate: endDate
        };
    }

    onSenderChange = (event) => {
        this.setState({ sender: event.target.value });
    }

    onCategoryChange = (event) => {
        this.setState({ category: event.target.value });
    }

    onStartDateChange = (event) => {
        this.setState({ startDate: event.target.value });
    }

    onEndDateChange = (event) => {
        this.setState({ endDate: event.target.value });
    }

    isFormValid = () => {
        const { sender, category, startDate, endDate } = this.state;
        return sender || category || startDate || endDate;
    }

    onSubmit = (event) => {
        event.preventDefault();

        const { sender, category, startDate, endDate } = this.state;
        this.props.setFilter(sender, category, startDate, endDate);
    }

    onCancel = (event) => {
        event.preventDefault();
        this.props.setFilter('', '', '', '');
    }

    render() {
        const { category, startDate, endDate } = this.state;
        return (
            <form onSubmit={this.onSubmit} onCancel={this.onCancel}>
                <Grid container direction={"column"} spacing={2} sx={{ marginTop: 1 }}>
                    {/**
                    <Grid item>
                        <TextField name="sender"
                            onBlur={this.onSenderChange}
                            onChange={this.onSenderChange}
                            label="Sender"
                            value={sender}
                            fullWidth
                            autoComplete="none" />
                    </Grid>
                    */}
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
                        <TextField name="startDate"
                            onBlur={this.onStartDateChange}
                            onChange={this.onStartDateChange}
                            label="Start of event date range"
                            type="date"
                            defaultValue={startDate}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                            autoComplete="none" />
                    </Grid>
                    <Grid item>
                        <TextField name="endDate"
                            onBlur={this.onEndDateChange}
                            onChange={this.onEndDateChange}
                            label="End of event date range"
                            type="date"
                            defaultValue={endDate}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                            autoComplete="none" />
                        <Button type="submit" disabled={!this.isFormValid()}>Submit</Button>
                        <Button type="button" onClick={this.onCancel}>Cancel</Button>
                    </Grid>
                </Grid>
            </form>
        );
    }
}

export default FilterForm;