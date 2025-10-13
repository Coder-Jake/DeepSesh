import React from 'react';

const Feedback = () => {
  const googleFormUrl = "https://docs.google.com/forms/d/e/1FAIpQLSfgO0G-w1AxSEUyQQ_CIeUe8pH9uKCY-u3khmwNnypHU4_xuQ/viewform?embedded=true";

  return (
    <main className="max-w-4xl mx-auto pt-16 px-4 pb-4 lg:pt-20 lg:px-6 lg:pb-6 flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold text-foreground mb-6">Give Feedback</h1>
      <div className="w-full max-w-2xl h-[80vh] bg-card rounded-lg shadow-lg overflow-hidden">
        <iframe
          src={googleFormUrl}
          width="100%"
          height="100%"
          frameBorder="0"
          marginHeight={0}
          marginWidth={0}
          title="Feedback Form"
          className="w-full h-full"
        >
          Loading...
        </iframe>
      </div>
    </main>
  );
};

export default Feedback;