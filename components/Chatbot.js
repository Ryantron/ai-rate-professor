"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  TextField,
  Typography,
  Paper,
  InputAdornment,
  IconButton,
  Avatar,
  Button,
} from "@mui/material";
import Fab from "@mui/material/Fab";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import InsertLinkIcon from "@mui/icons-material/InsertLink";
import ReactMarkdown from "react-markdown";
import BotIcon from "@mui/icons-material/SmartToy"; // Import AI bot icon
// Text popup for submit link
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
// Scraping libraries
// import axios from "axios";
// import * as cheerio from 'cheerio';

// Define the shape of a message according to the OpenAI API schema
const MessageComponent = ({ message }) => (
  <Box
    sx={{
      textAlign: message.roles === "user" ? "right" : "left",
      display: "flex",
      alignItems: "flex-start",
    }}
  >
    {message.roles !== "user" && (
      <Avatar sx={{ bgcolor: "grey.300", mr: 1 }}>
        <BotIcon />
      </Avatar>
    )}
    <Typography
      sx={{
        display: "inline-block",
        bgcolor: message.roles === "user" ? "primary.main" : "transparent",
        color: message.roles === "user" ? "white" : "black",
        borderRadius: 3,
        p: message.roles === "user" ? 1 : 0,
        paddingLeft: message.roles === "user" ? 3 : 0,
        paddingRight: message.roles === "user" ? 3 : 0,
        mb: 1,
        wordBreak: "break-word", // Ensure long words break appropriately
      }}
    >
      <ReactMarkdown>{message.content}</ReactMarkdown>
    </Typography>
  </Box>
);

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = React.useState(false);
  const messagesEndRef = useRef(null);

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;

    setLoading(true);

    const userMessage = { roles: "user", content: input };
    setMessages((messages) => [
      ...messages,
      userMessage,
      { roles: "system", content: "" },
    ]);
    setInput("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([...messages, userMessage]),
      });

      if (!response.ok) throw new Error("Network response was not ok");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        setMessages((messages) => {
          const lastMessage = messages[messages.length - 1];
          const otherMessages = messages.slice(0, messages.length - 1);
          return [
            ...otherMessages,
            { ...lastMessage, content: lastMessage.content + text },
          ];
        });
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((messages) => [
        ...messages.slice(0, messages.length - 1),
        {
          roles: "system",
          content:
            "I'm sorry, but I encountered an error. Please try again later.",
        },
      ]);
    }

    setLoading(false);
  };

  const handleWebScrap = async (link) => {
    console.log(link);
    if (!link.trim()) return;

    // TODO: no permission (CORS policy), try 
    const { data } = await axios.get(link);
    console.log(data);
  };

  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        p: 2,
        width: "75%",
        mx: "auto",
      }}
    >
      <Typography variant="h4" gutterBottom>
        AI Chatbot
      </Typography>
      <Paper
        sx={{
          flex: 1,
          p: 2,
          overflowY: "auto",
          mb: 2,
          maxHeight: "77%",
          boxShadow: "none",
        }}
      >
        {messages.length === 0 ? (
          <Typography
            sx={{ textAlign: "center", color: "grey.500", flex: 1 }}
            aria-live="polite"
          >
            Start the conversation by typing your message...
          </Typography>
        ) : (
          messages.map((msg, index) => (
            <MessageComponent key={index} message={msg} />
          ))
        )}
        <div ref={messagesEndRef} />
      </Paper>
      <Box sx={{ display: "flex", gap: 1 }}>
        {/* Submit link to professor's page on Rate My Professor */}
        <React.Fragment>
          <Fab onClick={handleClickOpen} color="primary">
            <InsertLinkIcon />
          </Fab>
          <Dialog
            open={open}
            onClose={handleClose}
            PaperProps={{
              component: "form",
              onSubmit: (event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                const formJson = Object.fromEntries(formData.entries());
                const professorLink = formJson.link; // Get the submitted link
                // TODO: Scraping logic here with the professorLink
                handleWebScrap(professorLink);
                handleClose();
              },
            }}
          >
            <DialogTitle>Submit RateMyProfessors Link</DialogTitle>
            <DialogContent>
              <DialogContentText>
                To add a professor&apos;s information, please enter the
                RateMyProfessors link here.
              </DialogContentText>
              <TextField
                autoFocus
                required
                margin="dense"
                id="link"
                name="link"
                label="RateMyProfessors Link Submission"
                type="url"
                fullWidth
                variant="standard"
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose}>Cancel</Button>
              <Button type="submit">Submit</Button>
            </DialogActions>
          </Dialog>
        </React.Fragment>

        <TextField
          fullWidth
          variant="outlined"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDownCapture={(e) => {
            if (e.key === "Enter" && !loading) handleSendMessage();
          }}
          disabled={loading}
          sx={{
            borderRadius: 30,
            "& .MuiOutlinedInput-root": {
              borderRadius: 30,
              paddingLeft: 3,
            },
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  color="primary"
                  onClick={handleSendMessage}
                  disabled={loading}
                >
                  <ArrowUpwardIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>
    </Box>
  );
};

export default Chatbot;
