/*
 * Copyright (c) 2021 Karl Li. All rights reserved.
 */
import React from 'react';
import './App.css';
import ResponsiveAppBar from './ResponsiveAppBar';
import MessageList from './MessageList';
import PostMessageForm from './PostMessageForm';
import FilterForm from './FilterForm';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      view: "messages",
      error: null,
      isLoaded: false,
      me: {},
      roles: [],
      users: new Map(),
      messages: [],
      messageToEdit: null,
      filter: {
        sender: '',
        category: '',
        startDate: '',
        endDate: ''
      }
    };
  }

  componentDidMount() {
    this.fetchMe();
    this.fetchUsers();
    this.fetchMessages();
    this.interval = setInterval(this.refresh, 60000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  fetchMoreMessages = () => {
    console.log("fetch more messages");
    const messages = this.state.messages;
    if (messages.length) {
      let last = messages[messages.length - 1];
      let before = Math.floor(Date.parse(last.updatedAt) / 1000);
      this.fetchMessages(before);
    } else {
      this.fetchMessages();
    }
  }

  mergeMessages(a, b) {
    if (!a) return b;
    if (!b) return a;

    const list = a.concat(b);
    const map = new Map(
      list.map(message => {
        return [message.id, message];
      }),
    );

    const c = Array.from(map.values());
    return c.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  fetchMessages(before) {
    if (!before) {
      before = Math.ceil(Date.now() / 1000);
    }

    let url = `api/messages/${before}`;
    let sep = '?';

    const { category, startDate, endDate } = this.state.filter;
    /*
    // Message table has only sender id, not name. Join will be too costly
    if (sender) {
      url += `${sep}sender=${encodeURIComponent(sender)}`;
      sep = '&';
    }
    */
    if (category) {
      url += `${sep}category=${encodeURIComponent(category)}`;
      sep = '&';
    }
    if (startDate) {
      url += `${sep}startDate=${encodeURIComponent(startDate)}`;
      sep = '&';
    }
    if (endDate) {
      url += `${sep}endDate=${encodeURIComponent(endDate)}`;
      sep = '&';
    }

    console.log(`fetch messages ${url}`);
    fetch(url)
      .then(res => res.json())
      .then(
        (result) => {
          const messages = this.state.messages;
          this.setState({
            isLoaded: true,
            messages: this.mergeMessages(messages, result)
          });

          const users = this.state.users;
          for (const message of result) {
            if (!users.has(message.createdBy)) {
              this.fetchUser(message.createdBy);
            }
          }
        },
        // Note: it's important to handle errors here
        // instead of a catch() block so that we don't swallow
        // exceptions from actual bugs in components.
        (error) => {
          this.setState({
            isLoaded: true,
            error
          });
        }
      )
  }

  fetchUsers() {
    fetch(`api/users`)
      .then(res => res.json())
      .then(
        (result) => {
          const users = this.state.users;
          result.forEach(user => {
            users.set(user.id, user);
          });

          this.setState({
            users: users
          });
        },
        // Note: it's important to handle errors here
        // instead of a catch() block so that we don't swallow
        // exceptions from actual bugs in components.
        (error) => {
          this.setState({
            isLoaded: true,
            error
          });
        }
      )
  }

  fetchUser(uid) {
    console.log(`fetch user ${uid}`);
    fetch(`api/user/${uid}`)
      .then(res => res.json())
      .then(
        (result) => {
          const users = this.state.users;
          users.set(result.id, result);
          this.setState({
            users: users
          });
        },
        // Note: it's important to handle errors here
        // instead of a catch() block so that we don't swallow
        // exceptions from actual bugs in components.
        (error) => {
          this.setState({
            isLoaded: true,
            error
          });
        }
      )
  }

  fetchMe() {
    fetch(`api/user/me`)
      .then(res => res.json())
      .then(
        (me) => {
          this.setState({
            me: me
          });

          if (me.email) {
            fetch(`api/roles/${me.email}`)
              .then(res => res.json())
              .then(
                (result) => {
                  this.setState({
                    roles: result.roles
                  })
                }
              )
          }
        },
        // Note: it's important to handle errors here
        // instead of a catch() block so that we don't swallow
        // exceptions from actual bugs in components.
        (error) => {
          this.setState({
            isLoaded: true,
            error
          });
        }
      )
  }

  upsertMessage = (id, title, body, category, startTime, endTime, method) => {
    const requestBody = {
      'id': id,
      'title': title,
      'body': body,
      'category': category,
      'createdBy': this.state.me.id
    }

    if (startTime && endTime) {
      requestBody.startTime = startTime;
      requestBody.endTime = endTime;
    }
    console.log(requestBody);

    const requestOptions = {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    };

    fetch(`/api/message`, requestOptions)
      .then(
        (result) => {
          this.refresh();
        },
        (error) => {
          alert(error);
        }
      )

    this.setState({
      view: "messages"
    });
  }

  deleteMessage = (message) => {
    if (message.createdBy === this.state.me.id) {
      fetch(`/api/message/${message.id}`, { method: 'DELETE' })
        .then(
          (result) => {
            let messages = this.state.messages;
            messages = messages.filter(m => m.id !== message.id);
            this.setState({
              messages: messages
            });
            this.refresh();
          },
          (error) => {
            console.log(error);
          }
        )
    } else {
      alert("Only message poster can delete it.");
    }
  }

  getUser = (id) => {
    return this.state.users.get(id);
  }

  refresh = () => {
    this.fetchUsers();
    this.fetchMessages();
  }

  handleRefresh = () => {
    this.refresh();
    this.setState({
      view: "messages"
    });
  }

  handlePost = (message) => {
    this.setState({
      view: "post",
      messageToEdit: message
    });
  }

  handleFilter = () => {
    this.setState({
      view: "filter"
    });
  }

  setFilter = (sender, category, startDate, endDate) => {
    this.setState({
      view: "messages",
      messages: [], // clean up cache
      filter: {
        sender: sender,
        category: category,
        startDate: startDate,
        endDate: endDate
      }
    });

    setTimeout(this.refresh, 100);
  }

  cancelPost = () => {
    this.setState({
      view: "messages"
    });
  }

  render() {
    const { view, error, isLoaded, me, roles, users, messages } = this.state;
    if (error) {
      return <div>Error: {error.message}</div>;
    } else if (!isLoaded) {
      return <h4>Loading...</h4>;
    } else {
      let content;
      if (view === "messages") {
        content = <MessageList me={me} roles={roles}
          users={users} messages={messages} getUser={this.getUser}
          fetchMoreMessages={this.fetchMoreMessages}
          editMessage={this.handlePost} deleteMessage={this.deleteMessage} />;
      } else if (view === "post") {
        content = <PostMessageForm messageToEdit={this.state.messageToEdit}
          upsertMessage={this.upsertMessage} cancelPost={this.cancelPost} />;
      } else {
        content = <FilterForm filter={this.state.filter} setFilter={this.setFilter} />;
      }
      return (
        <div >
          <ResponsiveAppBar me={me} handleRefresh={this.handleRefresh}
            handlePost={this.handlePost} handleFilter={this.handleFilter} />
          {content}
        </div>
      );
    }
  }
}

export default App;
