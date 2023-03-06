// @ts-ignore
import React from "react";
import TextField from "@mui/material/TextField";
import {Container} from "@mui/material";
import {LoadingButton} from "@mui/lab";

// @ts-ignore
const OpenAIInput = ({onChangeForm, loading, createArticle}) => {
    const [disabled, setDisabled] = React.useState(true);

    const onChangeTextField= (event) => {
        onChangeForm(event);
        setDisabled(event.target.value.length === 0);
    }

    return (
        <Container style={{ display: 'flex' }}>
            <TextField
                margin="normal"
                required
                style={{width: '85%', paddingRight: '20px'}}
                id="prompt"
                label="Article prompt"
                name="prompt"
                autoComplete="prompt"
                placeholder={"What do you want to create an article about"}
                autoFocus
                onChange={(event) => onChangeTextField(event)}
            />
            <LoadingButton
                size="small"
                onClick={(e) => createArticle()}
                loading={loading}
                disabled={disabled}
                variant="contained"
                style={{marginTop: '16px', marginBottom: '8px', width: '20%'}}
            >
                <span>Generate article</span>
            </LoadingButton>
        </Container>
    );
}
export default OpenAIInput
