"use client";

import React from 'react';
import { Linkedin, MessageSquare } from 'lucide-react'; // MessageSquare for Discord
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Footer = () => {
  return (
    <footer className="w-full border-t border-border px-4 py-3 lg:px-6 bg-background mt-auto">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4">
          <a 
            href="https://discord.gg/dtYakXSukh" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Join DeepSesh Discord"
          >
            <MessageSquare className="h-5 w-5" />
          </a>
          <a 
            href="https://www.linkedin.com/company/deepsesh/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-muted-foreground transition-colors hover:text-foreground"
            aria-label="DeepSesh LinkedIn Profile"
          >
            <Linkedin className="h-5 w-5" />
          </a>
        </div>
        <Link to="/credits" className="text-sm text-muted-foreground underline hover:text-foreground">
          Credits
        </Link>
      </div>
    </footer>
  );
};

export default Footer;