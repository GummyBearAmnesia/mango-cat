import React, { Component} from "react";
import MusicPlayer from "./MusicPlayer";

export default class SpotifyButton extends Component {
    constructor(props) {
        super(props);
        this.state = {
            spotifyAuthenticated: false,
            redirecting: false,
            albumUrl: "",
            tracks: [],
            song: {}  
        };
        this.getCurrentSong = this.getCurrentSong.bind(this);
    }

    // authenticating spotify and setting the interval to keep checking and getting the song the user is currently listening to
    //creates an illusion that its getting the user data in real time
    componentDidMount() {
        this.authenticateSpotify();
        this.interval = setInterval(this.getCurrentSong, 1000)
    }

    //clearing the interval 
    componentWillUnmount(){
        clearInterval(this.interval);
    }

    //authenticating the spotify user 
    authenticateSpotify() {

        if (this.state.spotifyAuthenticated) {
            console.log("User is already authenticated.");
            return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('code')) {
            console.log("Authorization code received, skipping redirect.");
            return;
        }

        fetch("http://localhost:8000/api/is-authenticated", {credentials: "include"})
            .then(response => response.json())
            .then(data => {
                console.log("Authentication status received:", data.status);
                this.setState({ spotifyAuthenticated: data.status });
                if (!data.status && !this.state.redirecting) {
                    console.log("User not authenticated, fetching auth URL.");
                    this.setState({ redirecting: true }); 
                    fetch("http://localhost:8000/api/get-auth-url", {credentials: "include"})
                        .then(response => response.json())
                        .then(data => {
                            console.log("Redirecting to Spotify login:", data.url);
                            // Using window.location.replace to ensure the history is replaced not to fall back to the same unauthenticated state
                            window.open(data.url);
                        });
                }
            })
            .catch(error => {
                console.error("Error during authentication process:", error);
            });
    }

    getCurrentSong() {
        fetch("http://localhost:8000/api/current-playing", {credentials: "include"}).then((response) => {
            if(!response.ok){
                return {};
            }
            else{
                return response.json();
            }
        }).then((data) => {
            this.setState({song: data})
            console.log(data);
        });
    }

    
    render() {
        return (
            <div style={{ maxWidth: '300px', margin: 'auto', padding: '10px' }}>
                <MusicPlayer {...this.state.song}/>
            </div>
        );
    }
}