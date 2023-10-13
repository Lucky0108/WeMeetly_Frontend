import React, { useState, useEffect, useRef } from 'react';

const API_URL = 'http://localhost:8000/api/posts/videos/stream';

const FeedPage = () => {
  const [videos, setVideos] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [endOfFeed, setEndOfFeed] = useState(false);
  let isFetching = false;
  const pageRef = useRef()
  pageRef.current = page;

  const fetchVideos = async (pageNum) => {
    if (!isFetching) {
        isFetching = true;

    if (loading || endOfFeed) return;
    console.log(pageNum)
    setLoading(true);
    try {
      // Fetch data for the next page
      const response = await fetch(`${API_URL}?page=${pageNum}`,{
        'Access-Control-Allow-Origin': '*'
      });
      const newData = await response.json();
      if (newData.posts.length === 0) {
        setEndOfFeed(true); // No more data
      } else {
        setVideos((prevData) => [...prevData, ...newData.posts]);
        setPage((prevPage) => prevPage + 1);
      }
    } catch (error) {
      console.error('Error fetching Videos:', error);
    }
    setLoading(false);
    setTimeout(() => {
        console.log('Fetching videos...');
        isFetching = false;  // Reset the flag after fetch is complete
    }, 1000);
    }
  };

  const handleScroll = () => {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (windowHeight + scrollTop >= documentHeight - 100) {
        fetchVideos(pageRef.current);
    }
    
  };

  useEffect(() => {
    fetchVideos(page);
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []); // Run only on component mount and unmount

  return (
    <div>
      <h1>Video Feed</h1>
      <div>
        {videos.map((video, index) => (
          <div key={index}>
            {/* Render video components */}
            <p>{video.title}</p>
            <video src={`http://localhost:8000${video.layout[0].media.url}`} autoPlay controls/>
            {/* ... other video details */}
          </div>
        ))}
      </div>
      {loading && <p>Loading more videos...</p>}
      {endOfFeed && <p> No more videos...</p>}
    </div>
  );
};

export default FeedPage;
