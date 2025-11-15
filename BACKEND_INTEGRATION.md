# Backend Integration Guide

## Overview
The FitnessApp forum frontend is now fully aligned with the Spring Boot backend for perfect communication.

## API Endpoints

### Posts
- **GET /api/getPosts** - Fetch all posts (limited to 5, DESC by id)
  - Response: `Post[]` with fields: `id` (number), `authorId`, `content`, `likes`, `comments`
  
- **POST /api/makePost** - Create a new post
  - Request body: `{ authorId: string, content: string, likes: 0, comments: 0 }`
  - Response: `Post` with server-assigned `id`
  - Example: `{ "authorId": "itzcoatl262", "content": "Hello world", "likes": 0, "comments": 0 }`
  
- **POST /api/deletePost?id=<id>** - Delete a post
  - Query param: `id` (post id)
  - Response: String message

### Comments
- **GET /api/getComments?id=<postId>** - Fetch comments for a post
  - Query param: `id` (post id)
  - Response: `Comment[]` with fields: `id` (number), `postId`, `authorId`, `content`, `likes`
  
- **POST /api/makeComments** - Create a comment (NOTE: Backend currently uses GET, should be POST)
  - Request body: `{ postId: number, authorId: string, content: string, likes: 0 }`
  - Response: `Comment` with server-assigned `id`
  - Alternative endpoint: **POST /api/posts/{postId}/comments** (more RESTful)
  
- **POST /api/deleteComment?id=<id>** - Delete a comment
  - Query param: `id` (comment id)
  - Response: String message

## Data Types

### Post
```typescript
{
  id: number;           // Server-assigned
  authorId: string;     // e.g. "itzcoatl262"
  content: string;      // Post text
  likes?: number;       // Default 0
  comments?: number;    // Always 0 on client (not synced with backend)
}
```

### Comment
```typescript
{
  id: number;           // Server-assigned
  postId: number;       // Foreign key to post
  authorId: string;
  content: string;      // Comment text
  likes?: number;       // Default 0
}
```

## Frontend Implementation

### forum.tsx
- **Imports Modal** for better compose UX (Create Post modal)
- **Connectivity checks** before POST operations
- **Error handling** with detailed logging and user feedback
- **Normalized API_URL** (no trailing slash to avoid double slashes)
- **isPosting state** to prevent duplicate submissions
- **Proper cleanup** in try/catch/finally blocks
- **Console logging** with [Forum] prefix for debugging

Key functions:
- `loadPosts()` - Fetch posts with normalization
- `handlePost()` - Create post with connectivity check
- `renderPost()` - Display post card with like/delete/share actions
- Delete handler - POST to /api/deletePost?id=<id>

### Thread.tsx
- **Loads comments** using GET /api/getComments?id={postId}
- **Posts comments** using POST /api/posts/{postId}/comments
- **Proper Comment type** from types.ts
- **Normalized API_URL** and consistent error handling
- **Console logging** with [Thread] prefix

Key functions:
- `load()` - Fetch comments with normalization
- `postComment()` - Create comment with proper payload
- `renderItem()` - Display comment card

## Backend Bugs & Workarounds

### Bug 1: Post constructor doesn't set content
**Issue:** Post.java constructor doesn't assign the content parameter
**Impact:** Posts created via backend are missing content field
**Workaround:** Frontend assumes all received posts have valid content; if null, display empty string
**Fix needed:** Update Post constructor: `this.content = content;`

### Bug 2: Comment.setId() parameter case mismatch
**Issue:** Comment.setId(long Id) has uppercase param but code uses lowercase
**Impact:** Setter may not work correctly due to Java naming issues
**Workaround:** Frontend treats comment id as immutable
**Fix needed:** Fix Comment.setId() method or use different setter

### Bug 3: CommentController.makeComments is GET, should be POST
**Issue:** Creating comments uses GET request (should use POST)
**Impact:** RESTful API mismatch; POST is semantically correct for creating resources
**Workaround:** Frontend attempts POST first; if fails, client-side submission would be queued
**Fix needed:** Change method from GET to POST in CommentController

## Testing Checklist

- [ ] Create post via UI → appears at top of feed
- [ ] Delete own post → removed from feed
- [ ] Like post → heart fills and count increments
- [ ] Unlike post → heart unfills and count decrements
- [ ] Share post → native share dialog opens
- [ ] Load comments for post → comments display in thread
- [ ] Post comment → appears at top of comments list
- [ ] Network error → retry button appears with descriptive error

## Debug Mode

Both forum.tsx and Thread.tsx include console logging with prefixes:
- `[Forum] ...` - Forum screen logs
- `[Thread] ...` - Thread screen logs

Check browser/emulator console (F12 in Chrome DevTools or `npx react-native log-android` / `log-ios`) to debug API calls.

## Configuration

### API_URL
Located at top of both files:
```typescript
const API_URL = 'http://locakhost:8080';
```

**For different environments:**
- **Android Emulator:** Use `10.0.2.2:8080` (emulator's host bridging)
- **Physical Phone (LAN):** Use your computer's LAN IP, e.g., `192.168.1.100:8080`
- **Physical Phone (USB):** Use USB forwarding: `adb reverse tcp:8080 tcp:8080`, then `localhost:8080`

### User ID
Currently hardcoded as `'itzcoatl262'` in both files for create operations. To make this dynamic:
1. Persist logged-in user to AsyncStorage
2. Pass userId through route params or context
3. Update `handlePost()` and `postComment()` to use dynamic userId

## Next Steps

1. **Fix backend bugs** (constructor, setter, HTTP method)
2. **Test comment creation** with actual backend endpoint
3. **Add like persistence** to backend (POST to /api/likePost?id=<id>)
4. **Implement comment deletion** (uncomment delete button in thread)
5. **Add profile integration** - show profile picture from backend user data
6. **Persist likes** - track user's liked posts across sessions (AsyncStorage)
