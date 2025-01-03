/*
 * Copyright (c) 2021 Karl Li. All rights reserved.
 */
import React from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import MessageCard from './MessageCard';
import './MessageList.css';

const MessageList = (props) => {
    const { me, roles, users, messages, getUser, fetchMoreMessages, editMessage, deleteMessage } = props;

    return (
        <div id="messageDiv">
            <InfiniteScroll
                className="Infinite-scroll"
                dataLength={messages.length} // This is important field to render the next data
                next={fetchMoreMessages}
                hasMore={true}
            >
                {messages.map(message => (
                    <div className="Message-card" key={message.id}>
                        <MessageCard me={me} roles={roles}
                          user={users.get(message.createdBy)}
                          message={message}
                          getUser={getUser}
                          editMessage={editMessage}
                          deleteMessage={deleteMessage} />
                    </div>
                ))}
            </InfiniteScroll>
        </div>
    );
}

export default MessageList;
