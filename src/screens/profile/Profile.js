import React, {Component} from 'react';
import './Profile.css';
import {constants} from '../../common/utils'
import Header from '../../common/header/Header';
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import Icon from '@material-ui/core/Icon';
import CardMedia from '@material-ui/core/CardMedia';
import GridList from '@material-ui/core/GridList';
import GridListTile from '@material-ui/core/GridListTile';
import IconButton from '@material-ui/core/IconButton';
import Modal from '@material-ui/core/Modal';
import Typography from '@material-ui/core/Typography';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Input from '@material-ui/core/Input';
import FormHelperText from '@material-ui/core/FormHelperText';
import FavoriteIconBorder from '@material-ui/icons/FavoriteBorder';
import FavoriteIconFill from '@material-ui/icons/Favorite';
import profileImage from "../../assets/upgrad.svg";

const styles = {
    comment:{
        marginBottom :'3rem'
    },
    paper: {
        position: 'relative',
        width: "180px",
        backgroundColor: "#fff",
        top: "30%",
        margin: "0 auto",
        boxShadow: "2px 2px #888888",
        padding: "20px"
    },
    media: {
        height: '200px',
        paddingTop: '56.25%', // 16:9
    },
    imageModal: {
        backgroundColor: "#fff",
        margin: "0 auto",
        boxShadow: "2px 2px #888888",
        padding: "10px",
    },
    addButton: {
        margin: '0.5rem',
        marginBottom: '2.6rem'
    }
};

class Profile extends Component {

    constructor(props) {
        super(props);
        if (sessionStorage.getItem('access-token') == null) {
            props.history.replace('/');
        }
        this.state = {
            profile_picture: null,
            username: null,
            full_name: null,
            posts: null,
            follows: null,
            followed_by: null,
            editOpen: false,
            fullNameRequired: 'dispNone',
            newFullName: '',
            mediaData: null,
            imageModalOpen: false,
            currentItem: null,
            likeSet:new Set(),
            comments:{},
            isLiked: false
        }
    }

    componentDidMount() {
        // this.getUserInfo();
        // this.getMediaData();
        this.getMediaInfo()
    }
    getMediaInfo =  () => {
        let that = this;
        let url = `${constants.mediaIdUrl}&access_token=${sessionStorage.getItem('access-token')}`;
        //calling first API
        return fetch(url,{
            method:'GET',
        }).then((response) =>{
            return response.json();
        }).then((jsonResponse) =>{
            const mediaArray = jsonResponse.data;
            const mediaInfo = []
            //Calling second Api in loop with all the ids returned by first API
            return  Promise.all(
                mediaArray.map(x => {
                    return new Promise((resolve) => {
                        let url = `https://graph.instagram.com/${x.id}?fields=id,media_type,media_url,username,timestamp&access_token=${sessionStorage.getItem('access-token')}`;
                        fetch(url,{
                            method:'GET',
                        })
                            .then(response => {
                                return new Promise(() => {
                                    response.json()
                                        .then(media => {
                                            mediaInfo.push(media)
                                            resolve()
                                        })
                                })
                            })
                    })
                })
            )
                .then(() => {
                    const comments = {};
                    mediaInfo.forEach(media=>{
                        const m = mediaArray.filter(x=>x.id===media.id);
                        media['caption'] = m[0].caption;
                        media['likes_count'] = 2; // Hard coding the number of likes
                        //Extracting Hashtags
                        let regex = /#(\w+)/g;
                        media['hashtags'] =  media.caption.match(regex);
                        media['hashtags'] =   media['hashtags']?media['hashtags'].join(' ') : ''
                        media.caption  = media.caption.replace(/#([^\s]*)/gm, '');
                        //Retrieving comments from Home page if any
                        if (sessionStorage.getItem(media.id+'comment') !== null) {
                            console.log(sessionStorage.getItem(media.id+'comment'));
                            comments[media.id] = JSON.parse(sessionStorage.getItem(media.id+'comment'));
                        }
                    })

                    that.setState({
                        profile_picture: profileImage,
                        data:mediaInfo,
                        filteredData:mediaInfo,
                        username: mediaInfo[0].username,
                        full_name: 'UpGrad Education',
                        posts: mediaInfo.length,
                        follows: '10',
                        followed_by: '20',
                        mediaData: mediaInfo,
                        comments: comments

                    });
                })

        }).catch((error) => {
            console.log('error user data',error);
        });
    }
    // getUserInfo = () => {
    //     let that = this;
    //     let url = `${constants.userMediaUrl}&access_token=${sessionStorage.getItem('access-token')}`;
    //     return fetch(url, {
    //         method: 'GET',
    //     }).then((response) => {
    //         return response.json();
    //     }).then((jsonResponse) => {
    //         that.setState({
    //             profile_picture: profileImage,
    //             username: jsonResponse.data[0].username,
    //             full_name: 'UpGrad Education',
    //             posts: jsonResponse.data.length,
    //             follows: '10',
    //             followed_by: '20',
    //         });
    //     }).catch((error) => {
    //         console.log('error user data',error);
    //     });
    // }

    // getMediaData = () => {
    //     let that = this;
    //     let url = `${constants.userMediaUrl}&access_token=${sessionStorage.getItem('access-token')}`;
    //     return fetch(url,{
    //         method: 'GET',
    //     }).then((response) => {
    //         return response.json();
    //     }).then((jsonResponse) => {
    //         const comments ={};
    //         const media = jsonResponse.data;
    //         media.forEach(m=>{
    //             m['username'] = m.username;
    //             m['likes_count'] =2;
    //             if (sessionStorage.getItem(m.id+'comment') !== null) {
    //                 comments[m.id] = JSON.parse(sessionStorage.getItem(m.id+'comment'));
    //             }
    //         })
    //         that.setState({
    //             mediaData: jsonResponse.data,
    //             comments:comments
    //         });
    //     }).catch((error) => {
    //         console.log('error media data',error);
    //     });
    // }

    handleOpenEditModal = () => {
        this.setState({ editOpen: true });
    }

    handleCloseEditModal = () => {
        this.setState({ editOpen: false });
    }

    handleOpenImageModal = (event) => {
        var result = this.state.mediaData.find(item => {
            return item.id === event.target.id
        })
        console.log(result);
        this.setState({ imageModalOpen: true, currentItem: result });
    }

    handleCloseImageModal = () => {
        this.setState({ imageModalOpen: false });
    }

    inputFullNameChangeHandler = (e) => {
        this.setState({
            newFullName: e.target.value
        })
    }

    updateClickHandler = () => {
        if (this.state.newFullName === '') {
            this.setState({ fullNameRequired: 'dispBlock'})
        } else {
            this.setState({ fullNameRequired: 'dispNone' })
        }

        if (this.state.newFullName === "") { return }

        this.setState({
            full_name: this.state.newFullName
        })

        this.handleCloseEditModal()
    }

    likeClickHandler = (id) =>{
        console.log('like id',id);
        var foundItem = this.state.currentItem;

        if (typeof foundItem !== undefined) {
            if (!this.state.likeSet.has(id)) {
                foundItem.likes_count++;
                this.setState(({likeSet}) => ({
                    likeSet:new Set(likeSet.add(id))
                }))
                console.log(JSON.stringify(this.state.likeSet));
            }else {
                foundItem.likes_count--;
                this.setState(({likeSet}) =>{
                    const newLike = new Set(likeSet);
                    newLike.delete(id);

                    return {
                        likeSet:newLike
                    };
                });
                console.log(JSON.stringify(this.state.likeSet));
            }
        }
    }

    onAddCommentClicked = (id) => {
        console.log('id',id);
        if (this.state.currentComment === "" || typeof this.state.currentComment === undefined) {
            return;
        }

        let commentList = this.state.comments.hasOwnProperty(id)?
            this.state.comments[id].concat(this.state.currentComment): [].concat(this.state.currentComment);

        this.setState({
            comments:{
                ...this.state.comments,
                [id]:commentList
            },
            currentComment:''
        })
    }

    commentChangeHandler = (e) => {
        this.setState({
            currentComment:e.target.value
        });
    }

    logout = () => {
        sessionStorage.clear();
        this.props.history.replace('/');
    }

    render() {
        return(
            <div>
                <Header
                    screen={"Profile"}
                    userProfileUrl={this.state.profile_picture}
                    handleLogout={this.logout}/>
                <div className="information-section">
                    <Avatar
                        alt="User Image"
                        src={this.state.profile_picture}
                        style={{width: "50px", height: "50px"}}
                    />
                    <span style={{marginLeft: "20px"}}>
                        <div style={{width: "600px", fontSize: "big", marginBottom:'1rem'}}>
                            <div style={{ fontWeight:500, marginBottom:'0.5rem'}}>   {this.state.username}</div>
                            <div style={{float: "left", width: "200px", fontSize: "small"}}> Posts: {this.state.posts} </div>
                            <div style={{float: "left", width: "200px", fontSize: "small"}}> Follows: {this.state.follows} </div>
                            <div style={{float: "left", width: "200px", fontSize: "small"}}> Followed By: {this.state.followed_by}</div> <br />
                        </div>
                        <div style={{fontSize: "small"}}> {this.state.full_name}
                            <Button mini variant="fab" color="secondary" aria-label="Edit" style={{marginLeft: "20px"}} onClick={this.handleOpenEditModal}>
                            <Icon>edit_icon</Icon>
                        </Button>
                        </div>
                        <Modal
                            aria-labelledby="edit-modal"
                            aria-describedby="modal to edit user full name"
                            open={this.state.editOpen}
                            onClose={this.handleCloseEditModal}
                            style={{alignItems: 'center', justifyContent: 'center'}}
                        >
                            <div style={styles.paper}>
                                <Typography variant="h5" id="modal-title">
                                    Edit
                                </Typography><br />
                                <FormControl required>
                                    <InputLabel htmlFor="fullname">Full Name</InputLabel>
                                    <Input id="fullname" onChange={this.inputFullNameChangeHandler} />
                                    <FormHelperText className={this.state.fullNameRequired}><span className="red">required</span></FormHelperText>
                                </FormControl><br /><br /><br />
                                <Button variant="contained" color="primary" onClick={this.updateClickHandler}>
                                    UPDATE
                                </Button>
                            </div>
                        </Modal>
                    </span>
                </div>

                {this.state.mediaData != null &&
                <GridList cellHeight={'auto'} cols={3} style={{padding: "40px"}}>
                    {this.state.mediaData.map(item => (
                        <GridListTile key={item.id}>
                            <CardMedia
                                id={item.id}
                                style={styles.media}
                                image={item.media_url}
                                title={item.caption}
                                onClick={this.handleOpenImageModal}
                            />
                        </GridListTile>
                    ))}
                </GridList>}

                {this.state.currentItem != null &&
                <Modal
                    aria-labelledby="image-modal"
                    aria-describedby="modal to show image details"
                    open={this.state.imageModalOpen}
                    onClose={this.handleCloseImageModal}
                    style={{display:'flex',justifyContent:'center',alignItems:'center'}}>
                    <div style={{display:'flex',flexDirection:'row',backgroundColor: "#fff",width:'70%',height:'70%', padding:'1rem'}}>
                        <div style={{width:'50%',padding:10}}>
                            <img style={{height:'100%',width:'100%'}}
                                 src={this.state.currentItem.media_url}
                                 alt={this.state.currentItem.caption} />
                        </div>

                        <div style={{display:'flex', flexDirection:'column', width:'50%', padding:10}}>
                            <div style={{borderBottom:'2px solid #f2f2f2',display:'flex', flexDirection:'row',justifyContent:'flex-start',alignItems:'center'}}>
                                <Avatar
                                    alt="User Image"
                                    src={this.state.profile_picture}
                                    style={{width: "50px", height: "50px",margin:'10px'}}/>
                                <Typography component="p">
                                    {this.state.username}
                                </Typography>
                            </div>
                            <div style={{display:'flex', height:'100%', flexDirection:'column', justifyContent:'space-between',marginTop:'1rem'}}>
                                <div>
                                    <Typography component="p">
                                        {this.state.currentItem.caption}
                                    </Typography>
                                    <Typography style={{color:'#4dabf5'}} component="p" >
                                        {this.state.currentItem.hashtags}
                                    </Typography>
                                    {this.state.comments.hasOwnProperty(this.state.currentItem.id) && this.state.comments[this.state.currentItem.id].map((comment, index)=>{
                                        return(
                                            <div key={index} className="row">
                                                <Typography component="p" style={{fontWeight:'bold'}}>
                                                    {sessionStorage.getItem('username')}:
                                                </Typography>
                                                <Typography component="p" >
                                                    {comment}
                                                </Typography>
                                            </div>
                                        )
                                    })}
                                </div>
                                <div>
                                    <div className="row">
                                        <IconButton aria-label="Add to favorites" onClick={this.likeClickHandler.bind(this,this.state.currentItem.id)}>
                                            {this.state.likeSet.has(this.state.currentItem.id) && <FavoriteIconFill style={{color:'#F44336'}}/>}
                                            {!this.state.likeSet.has(this.state.currentItem.id) && <FavoriteIconBorder/>}
                                        </IconButton>
                                        <Typography component="p">
                                            {this.state.currentItem.likes_count} Likes
                                        </Typography>
                                    </div>
                                    <div className="row">
                                        <FormControl style={{flexGrow:1}}>
                                            <InputLabel htmlFor="comment">Add Comment</InputLabel>
                                            <Input  style={styles.comment} id="comment" value={this.state.currentComment} onChange={this.commentChangeHandler}/>
                                        </FormControl>
                                        <FormControl>
                                            <Button style={styles.addButton} onClick={this.onAddCommentClicked.bind(this,this.state.currentItem.id)}
                                                    variant="contained" color="primary">
                                                ADD
                                            </Button>
                                        </FormControl>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </Modal>}
            </div>
        )
    }
}

export default Profile;
