import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 py-20 px-4 sm:px-6 lg:px-8 flex justify-center items-center">
      <Card className="max-w-md w-full bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-8">
        <CardContent className="p-0">
          <h1 className="text-3xl font-bold text-white mb-6 text-center">Contact Us</h1>
          <p className="text-gray-400 mb-8 text-center">
            Have questions, feedback, or need support? Reach out to us and
            we'll get back to you as soon as possible.
          </p>
          <form className="space-y-6">
            <Input placeholder="Your Name" className="h-12 rounded-lg bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500" />
            <Input type="email" placeholder="Your Email" className="h-12 rounded-lg bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500" />
            <Textarea placeholder="Your Message" rows={6} className="rounded-lg bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500" />
            <Button type="submit" className="w-full h-12 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all">
              Send Message
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default ContactPage; 
