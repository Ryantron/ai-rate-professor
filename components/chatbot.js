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
  CircularProgress,
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
import axios from "axios";

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
  const [msgLoading, setMsgLoading] = useState(false); // Sending messages
  const [submitLoading, setSubmitLoading] = useState(false); // Link submission loading
  const [status, setStatus] = useState(null); // Link submission result: null, 'success', 'failure'
  const [open, setOpen] = React.useState(false);
  const messagesEndRef = useRef(null);

  const handleSendMessage = async () => {
    if (!input.trim() || msgLoading) return;

    setMsgLoading(true);

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

    setMsgLoading(false);
  };

  const handleWebScrap = async (link) => {
    if (!link.trim()) return;
    setSubmitLoading(true);
    // NOTE: query on server side (/api/link) w. middleware setup for CORS
    var reviews = "";
    try {
      const response = await axios.get(`/api/link`, { params: { url: link } });
      reviews = response.data; // NOTE: assuming valid link to ratemyprofessors used
    } catch (error) {
      console.error("Error during web scraping:", error);
      setStatus("failure");
      setSubmitLoading(false);
      return; // Skip POST request
    }

    try {
      await axios.post(`/api/link`, reviews);
      setStatus("success");
    } catch (error) {
      setStatus("failure");
      console.error("Error during POST request to Pinecone:", error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const professorLink = formData.get("link");

    setStatus(null); // Reset status before submission
    try {
      await handleWebScrap(professorLink);
    } catch (error) {
      console.error("Error:", error);
    }
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
          <Dialog open={open} onClose={handleClose}>
            <DialogTitle>Submit RateMyProfessors Link</DialogTitle>
            <DialogContent>
              <DialogContentText>
                To add a professor&apos;s information, please enter the
                RateMyProfessors link here.
              </DialogContentText>
              {submitLoading ? (
                <CircularProgress
                  style={{ display: "block", margin: "0 auto" }}
                />
              ) : (
                <form onSubmit={handleSubmit}>
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
                  <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button type="submit">Submit</Button>
                  </DialogActions>
                </form>
              )}
            </DialogContent>
          </Dialog>

          {/* Success or Failure Message */}
          <Dialog open={status === "success"} onClose={() => setStatus(null)}>
            <DialogTitle>Success</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Your RateMyProfessors link has successfully submitted!
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setStatus(null)}>Close</Button>
            </DialogActions>
          </Dialog>

          <Dialog open={status === "failure"} onClose={() => setStatus(null)}>
            <DialogTitle>Failure</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Your RateMyProfessors link failed to submit.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setStatus(null)}>Close</Button>
            </DialogActions>
          </Dialog>
        </React.Fragment>

        <TextField
          fullWidth
          variant="outlined"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDownCapture={(e) => {
            if (e.key === "Enter" && !msgLoading) handleSendMessage();
          }}
          disabled={msgLoading}
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
                  disabled={msgLoading}
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
