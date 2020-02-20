import React from 'react';
import {Row, Col} from 'antd';

class Footer extends React.Component {
  render () {
    const {themeConfig} = this.props;
    return (
      <footer id="footer" className="dark footer clearfix">
        <Row className="bottom-bar">
          <Col md={24} sm={24} style={{textAlign: 'center'}}>
            <span style={{textAlign: 'center'}}>Copyright © {themeConfig.footer.copyright}</span>
          </Col>
        </Row>
      </footer>
    );
  }
}

export default Footer;
