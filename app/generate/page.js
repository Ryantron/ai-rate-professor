import Chatbot from "@/components/Chatbot";
import { Box, Container } from "@mui/material";
import Navbar from "@/components/navbar"

export default function Generate() {
  return (
    <Box s={{m: 0}}>
      {/* Header */}
      <Navbar home={false}/>
      <Box>
        <Chatbot/>
      </Box>
    </Box>
  );
}