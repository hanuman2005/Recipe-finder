import React from "react";
import styled from "styled-components";

const FollowUsSection = styled.div`
  background-color: white;
  padding: 3rem 0;
`;

const FollowUsSectionHeading = styled.h1`
  text-align: center;
  color: #183b56;
  font-family: "Roboto";
  font-size: 28px;
  font-weight: 700;
`;

const IconContainer = styled.div`
  background-color: #faf7e8;
  width: 80px;
  height: 80px;
  border-radius: 40px;
  margin: 15px;
  padding-top: 22px;
  padding-bottom: 14px;
  padding-right: 16px;
  padding-left: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Icon = styled.i`
  color: #d0b200;
  font-size: 35px;
`;

const FooterSection = styled.div`
  background-color: #0d2436;
  padding: 3rem 0;
`;

const FooterSectionMailId = styled.h1`
  color: #959ead;
  font-family: "Roboto";
  font-weight: bold;
  font-size: 16px;
  margin-top: 20px;
`;

const FooterSectionAddress = styled.p`
  color: #959ead;
  font-family: "Roboto";
  font-size: 14px;
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 20px;
`;

const Col12 = styled.div`
  grid-column: span 12;
`;

const IconsWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
`;

const LogoImg = styled.img`
  width: 100px;
  height: auto;
`;

const Footer = () => {
  return (
    <div>
      <FollowUsSection>
        <Container>
          <Row>
            <Col12>
              <FollowUsSectionHeading>Follow Us</FollowUsSectionHeading>
            </Col12>
            <Col12>
              <IconsWrapper>
                <IconContainer>
                  <Icon className="fab fa-twitter"></Icon>
                </IconContainer>
                <IconContainer>
                  <Icon className="fab fa-instagram"></Icon>
                </IconContainer>
                <IconContainer>
                  <Icon className="fab fa-facebook"></Icon>
                </IconContainer>
              </IconsWrapper>
            </Col12>
          </Row>
        </Container>
      </FollowUsSection>
      <FooterSection>
        <Container>
          <Row>
            <Col12>
              <div style={{ textAlign: "center" }}>
                <LogoImg src="https://i.imgur.com/raLQH6o.jpeg" alt="Logo" />
                <FooterSectionMailId>spicescoop@gmail.com</FooterSectionMailId>
                <FooterSectionAddress>
                  SRKR ENGINEERING COLLEGE, BHIMAVARAM
                </FooterSectionAddress>
              </div>
            </Col12>
          </Row>
        </Container>
      </FooterSection>
    </div>
  );
};

export default Footer;
