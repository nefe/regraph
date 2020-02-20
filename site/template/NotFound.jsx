import React from 'react';
import PropTypes from 'prop-types';
import {Link} from 'react-router';
import {Button} from 'antd';
import logo from '../static/images/404.svg'

class NotFound extends React.Component {
  render () {
    return <div className="page-404 status-content">
      <section>
        <p>
          <img src={logo} alt=""/>
        </p>
        <h1 className="page-404-title">404 <span>你要找的页面不存在</span></h1>
        <p className="page-404-message">
          <Button type="primary">
            <Link to="/">返回首页</Link>
          </Button>
        </p>
      </section>
      <style
        dangerouslySetInnerHTML={{
          __html: '#react-content { height: 100%; background-color: #fff }',
        }}
      />
    </div>;
  }
}

NotFound.propTypes = {
  className: PropTypes.string,
};

export default NotFound
