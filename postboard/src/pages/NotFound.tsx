import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <h1>404</h1>
        <h2>页面未找到</h2>
        <p>抱歉，您访问的页面不存在或已被移除。</p>
        <Link to="/" className="back-home-button">
          返回首页
        </Link>
      </div>
      
      <style jsx>{`
        .not-found-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 80vh;
          background-color: #f7fafc;
        }

        .not-found-content {
          text-align: center;
          padding: 40px;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        h1 {
          font-size: 8rem;
          margin: 0;
          color: #3182ce;
          font-weight: 700;
        }

        h2 {
          font-size: 2rem;
          margin: 0 0 16px 0;
          color: #2d3748;
        }

        p {
          font-size: 1.125rem;
          margin: 0 0 24px 0;
          color: #718096;
        }

        .back-home-button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #3182ce;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          font-weight: 500;
          transition: background-color 0.2s;
        }

        .back-home-button:hover {
          background-color: #2b6cb0;
        }
      `}</style>
    </div>
  );
};

export default NotFound;
