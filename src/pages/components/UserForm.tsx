// User form component using bootstrap classes to style and should where the user can login if he has an account or register if he doesn't

// Should use the existing components LoginForm and RegisterForm

import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
// @ts-ignore
import React from "react";
import {Container} from "@mui/material";

const UserForm = ({loggedIn}) => {

    const [hasUser, setHasUser] = React.useState(true);

    const swapForm = (event: Event) => {
        event.preventDefault();
        setHasUser(!hasUser);
    }

    return (
        <Container maxWidth="md" className="container">
            {hasUser ? <LoginForm swap={swapForm} loggedIn={loggedIn}/> : <RegisterForm swap={swapForm} loggedIn={loggedIn}/>}
        </Container>
    );
}

export default UserForm;
