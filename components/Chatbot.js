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
  Divider,
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

// Define the shape of a message according to the OpenAI API schema
const MessageComponent = ({ message }) => (
  <>
    <Box
      sx={{
        textAlign: message.roles === "user" ? "right" : "left",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: message.roles === "user" ? "flex-end" : "flex-start", // Align user text to the right
      }}
    >
      {message.roles !== "user" && (
        <Avatar sx={{ bgcolor: "#F6B17A", mt: 2, mr: 1 }}>
          <BotIcon />
        </Avatar>
      )}
      <Typography
        sx={{
          display: "inline-block",
          bgcolor: message.roles === "user" ? "#F6B17A" : "transparent",
          color: message.roles === "user" ? "white" : "white",
          borderRadius: 3,
          px: 2,
          mb: 1,
          wordBreak: "break-word", // Ensure long words break appropriately
        }}
      >
        <ReactMarkdown>{message.content}</ReactMarkdown>
      </Typography>
    </Box>
  </>
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
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', p: 2 }}>
        <Paper
          sx={{
            flex: 1,
            p: 4,
            overflowY: "auto",
            mb: 2,
            minHeight: "67vh",
            maxHeight: "67vh",
            boxShadow: "none",
            borderRadius: 4,
            backgroundColor: '#424769',
          }}
        >
          {messages.length === 0 ? (
            <Typography
              sx={{ textAlign: "center", color: "#F6B17A", mt: '30vh', flex: 1 }}
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
            <Dialog
              open={open}
              onClose={handleClose}
              PaperProps={{
                sx: {
                  backgroundColor: "#7077A1", // Change background color of Dialog Paper
                  borderRadius: 4,
                },
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
              <DialogTitle sx={{ color: "white" }}>
                Submit RateMyProfessors Link
              </DialogTitle>
              <DialogContent>
                <DialogContentText sx={{ color: "white" }}>
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
                  InputLabelProps={{
                    sx: { color: "white" }, // Change label color to white
                  }}
                  sx={{
                    "& .MuiInput-underline:before": {
                      borderBottomColor: "white", // Change underline color to white
                    },
                    "& .MuiInputBase-input": {
                      color: "white", // Change input text color to white
                    },
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-focused fieldset': {
                        borderColor: '#F6B17A',
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#F6B17A',
                    },
                  }}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={handleClose} sx={{ color: "#F6B17A" }}>
                  Cancel
                </Button>
                <Button type="submit" sx={{ color: "#F6B17A" }}>
                  Submit
                </Button>
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
              backgroundColor: "#7077A1",
              "& .MuiOutlinedInput-root": {
                borderRadius: 30,
                paddingLeft: 2,
                color: "white", // Set input text color to white
                "& fieldset": {
                  borderColor: "transparent", // Remove border highlight if possible
                },
                "&:hover fieldset": {
                  borderColor: "transparent", // Remove border on hover
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#transparent", // Change highlight color to F6B17A when focused
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IconButton
                    sx={{ color: "#F6B17A" }}
                    onClick={handleClickOpen}
                    disabled={loading}
                  >
                    <InsertLinkIcon />
                  </IconButton>
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    sx={{ color: "#F6B17A" }}
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
    </>
  );
};

export default Chatbot;
