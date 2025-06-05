import React from 'react';

function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 text-center">About EventHub</h1>
        
        <p className="text-lg text-gray-300 mb-6">
          EventHub is a leading platform dedicated to simplifying the process of event discovery, creation, and management. Our mission is to connect people through shared experiences by providing intuitive tools for both event organizers and attendees.
        </p>

        <h2 className="text-3xl font-bold text-white mb-6">Our Mission</h2>
        <p className="text-lg text-gray-300 mb-10">
          To empower individuals and organizations to bring their events to life and enable everyone to easily find and participate in events that matter to them.
        </p>

        <h2 className="text-3xl font-bold text-white mb-6">What We Offer</h2>
        <ul className="list-disc list-inside space-y-4 text-gray-300 text-lg mb-10">
          <li>Seamless event creation and customization</li>
          <li>Integrated ticketing and registration</li>
          <li>Tools for managing attendees and check-ins</li>
          <li>Options for hosting both physical and virtual events</li>
          <li>Easy event discovery and browsing for attendees</li>
          <li>Personalized dashboards for organizers and attendees</li>
        </ul>

        <h2 className="text-3xl font-bold text-white mb-6">Our Story</h2>
        <p className="text-lg text-gray-300 mb-10">
          Founded in [Year - Replace with actual year if known], EventHub was born out of a passion for bringing people together. We saw a need for a more streamlined and user-friendly platform for event management and set out to build it. Since then, we've helped thousands of organizers successfully host a wide range of events and connected countless attendees with experiences they love.
        </p>

        <h2 className="text-3xl font-bold text-white mb-6">Join Our Community</h2>
        <p className="text-lg text-gray-300 mb-10">
          Whether you're looking to host your next big event or find exciting activities happening near you, EventHub is the place to be. Join our growing community and start creating or discovering unforgettable experiences today!
        </p>

      </div>
    </div>
  );
}

export default AboutPage; 
