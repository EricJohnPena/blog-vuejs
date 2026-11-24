<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Notyf } from "notyf";
import api from "../api";
import { useGlobalStore } from "../stores/user";

const route = useRoute();
const router = useRouter();
const notyf = new Notyf();
const { user } = useGlobalStore();

const post = ref(null);
const isLoading = ref(true);

// Edit state
const isEditing = ref(false);
const isUpdating = ref(false);
const editTitle = ref("");
const editContent = ref("");

// Delete state
const showDeleteConfirm = ref(false);
const isDeleting = ref(false);

// Comment state
const newComment = ref("");
const isSubmittingComment = ref(false);

// Role & ownership checks (supports populated author object or raw ObjectId)
const isOwner = computed(() => {
  if (!user.token || !post.value?.author) return false;
  const authorId = post.value.author?._id || post.value.author;
  const authorEmail = post.value.author?.email;

  return (
    (user.id && String(authorId) === String(user.id)) ||
    (user.email && authorEmail === user.email)
  );
});

const isAdmin = computed(() => Boolean(user.token && user.isAdmin));
const canDelete = computed(() => isOwner.value || isAdmin.value);

const comments = computed(() => {
  if (!post.value) return [];
  return Array.isArray(post.value.comments) ? post.value.comments : [];
});

const canSaveEdit = computed(
  () => editTitle.value.trim().length > 0 && editContent.value.trim().length > 0
);

function getAuthorLabel(author) {
  if (!author) return "Unknown Author";
  if (typeof author === "string") return author;
  return author.email || author.username || "Unknown Author";
}

function getCommentAuthorEmail(comment) {
  return (
    comment.author?.email ||
    comment.user?.email ||
    comment.userId?.email ||
    comment.email ||
    "Anonymous"
  );
}

function getCommentText(comment) {
  return comment.comment || comment.content || comment.text || "";
}

function getInitial(label) {
  return (label || "?").charAt(0).toUpperCase();
}

function formatDate(record) {
  const rawDate =
    record?.creationDate ||
    record?.createdAt ||
    record?.dateCreated ||
    record?.createdOn;
  if (!rawDate) return null;

  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

async function fetchPost() {
  isLoading.value = true;

  try {
    const { data } = await api.get(`/posts/${route.params.id}`);
    post.value = data.post || data;
  } catch (error) {
    console.error("Failed to load post:", error);
    notyf.error("Failed to load post details.");
    post.value = null;
  } finally {
    isLoading.value = false;
  }
}

function startEditing() {
  editTitle.value = post.value.title || "";
  editContent.value = post.value.content || "";
  showDeleteConfirm.value = false;
  isEditing.value = true;
}

function cancelEditing() {
  isEditing.value = false;
}

async function handleUpdatePost() {
  if (!canSaveEdit.value || isUpdating.value) return;

  isUpdating.value = true;

  try {
    const { data } = await api.patch(`/posts/update/${route.params.id}`, {
      title: editTitle.value.trim(),
      content: editContent.value.trim(),
    });

    // Update local post while preserving populated fields if backend returns unpopulated doc
    const updated = data.updatedPost || data.post || data;
    post.value = {
      ...post.value,
      title: updated.title ?? editTitle.value.trim(),
      content: updated.content ?? editContent.value.trim(),
    };

    isEditing.value = false;
    notyf.success("Post updated successfully!");
  } catch (error) {
    console.error("Failed to update post:", error);
    notyf.error(error.response?.data?.message || "Failed to update post.");
  } finally {
    isUpdating.value = false;
  }
}

async function handleDeletePost() {
  if (isDeleting.value) return;

  isDeleting.value = true;

  try {
    await api.delete(`/posts/delete/${route.params.id}`);
    notyf.success("Post deleted.");
    router.push({ path: "/" });
  } catch (error) {
    console.error("Failed to delete post:", error);
    notyf.error(error.response?.data?.message || "Failed to delete post.");
  } finally {
    isDeleting.value = false;
  }
}

async function handleAddComment() {
  const trimmed = newComment.value.trim();
  if (!trimmed || isSubmittingComment.value) return;

  isSubmittingComment.value = true;

  try {
    await api.patch(`/posts/addComment/${route.params.id}`, {
      comment: trimmed
    });

    newComment.value = "";
    notyf.success("Comment added!");
    await fetchPost();
  } catch (error) {
    console.error("Failed to add comment:", error);
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      notyf.error("Please sign in to post a comment.");
    } else {
      notyf.error(error.response?.data?.message || "Failed to add comment.");
    }
  } finally {
    isSubmittingComment.value = false;
  }
}

onMounted(() => {
  fetchPost();
});
</script>

<template>
  <div class="bg-light min-vh-100 py-5">
    <div class="container" style="max-width: 820px">
      <!-- Top Back Navigation -->
      <div class="mb-4">
        <router-link
          to="/"
          class="btn btn-white bg-white border shadow-sm rounded-pill px-3 py-2 small fw-medium text-secondary d-inline-flex align-items-center gap-2 back-link"
        >
          <i class="bi bi-arrow-left"></i>
          Back to Posts
        </router-link>
      </div>

      <!-- Loading Skeleton -->
      <div
        v-if="isLoading"
        class="card border-0 shadow-sm rounded-4 p-4 p-md-5 placeholder-glow"
      >
        <div class="d-flex align-items-center gap-3 mb-4">
          <span class="placeholder rounded-circle" style="width: 44px; height: 44px"></span>
          <div class="flex-grow-1">
            <span class="placeholder col-4 d-block mb-2 rounded"></span>
            <span class="placeholder col-2 d-block rounded"></span>
          </div>
        </div>
        <span class="placeholder col-8 py-3 mb-4 rounded"></span>
        <span class="placeholder col-12 mb-2 rounded"></span>
        <span class="placeholder col-12 mb-2 rounded"></span>
        <span class="placeholder col-9 rounded"></span>
      </div>

      <!-- Not Found State -->
      <div
        v-else-if="!post"
        class="card border-0 shadow-sm rounded-4 text-center py-5 px-4"
      >
        <div class="card-body">
          <div
            class="d-inline-flex align-items-center justify-content-center rounded-circle bg-danger bg-opacity-10 text-danger mb-3"
            style="width: 64px; height: 64px"
          >
            <i class="bi bi-journal-x fs-2"></i>
          </div>
          <h4 class="fw-bold mb-1">Post not found</h4>
          <p class="text-muted mb-4">
            This post may have been removed or the link is invalid.
          </p>
          <router-link to="/" class="btn btn-primary rounded-pill px-4">
            <i class="bi bi-house-door me-2"></i>Return Home
          </router-link>
        </div>
      </div>

      <!-- Loaded Post + Comments -->
      <template v-else>
        <!-- Main Article Card -->
        <article class="card border-0 shadow-sm rounded-4 mb-4">
          <div class="card-body p-4 p-md-5">
            <!-- Author Header & Action Controls -->
            <div
              class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 pb-4 mb-4 border-bottom"
            >
              <div class="d-flex align-items-center gap-3">
                <div
                  class="rounded-circle bg-primary bg-opacity-10 text-primary fw-bold d-flex align-items-center justify-content-center flex-shrink-0"
                  style="width: 44px; height: 44px"
                >
                  {{ getInitial(getAuthorLabel(post.author)) }}
                </div>
                <div>
                  <div class="fw-semibold text-dark d-flex align-items-center gap-2 flex-wrap">
                    <span>{{ getAuthorLabel(post.author) }}</span>
                    <span
                      v-if="isOwner"
                      class="badge rounded-pill bg-primary bg-opacity-10 text-primary fw-medium"
                    >
                      Author
                    </span>
                  </div>
                  <div v-if="formatDate(post)" class="text-muted small">
                    <i class="bi bi-calendar3 me-1"></i>{{ formatDate(post) }}
                  </div>
                </div>
              </div>

              <!-- Owner: Edit + Delete | Admin (non-owner): Delete only -->
              <div
                v-if="(isOwner || canDelete) && !isEditing"
                class="d-flex align-items-center gap-2"
              >
                <button
                  v-if="isOwner"
                  type="button"
                  class="btn btn-outline-primary btn-sm rounded-pill px-3 fw-medium"
                  @click="startEditing"
                >
                  <i class="bi bi-pencil-square me-1"></i>Edit
                </button>

                <button
                  v-if="canDelete"
                  type="button"
                  class="btn btn-outline-danger btn-sm rounded-pill px-3 fw-medium"
                  @click="showDeleteConfirm = !showDeleteConfirm"
                >
                  <i class="bi bi-trash3 me-1"></i>Delete
                </button>
              </div>
            </div>

            <!-- Inline Delete Confirmation Banner -->
            <div
              v-if="showDeleteConfirm"
              class="alert alert-danger border-0 rounded-3 d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4"
              role="alert"
            >
              <div class="small">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                <strong>Delete this post?</strong> This action cannot be undone.
              </div>
              <div class="d-flex gap-2 flex-shrink-0">
                <button
                  type="button"
                  class="btn btn-light btn-sm rounded-pill px-3"
                  :disabled="isDeleting"
                  @click="showDeleteConfirm = false"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  class="btn btn-danger btn-sm rounded-pill px-3 fw-medium"
                  :disabled="isDeleting"
                  @click="handleDeletePost"
                >
                  <span
                    v-if="isDeleting"
                    class="spinner-border spinner-border-sm me-1"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  {{ isDeleting ? "Deleting..." : "Confirm Delete" }}
                </button>
              </div>
            </div>

            <!-- Inline Edit Mode (Owner Only) -->
            <form v-if="isEditing" @submit.prevent="handleUpdatePost">
              <div class="mb-3">
                <label
                  for="editTitle"
                  class="form-label fw-medium small text-uppercase text-muted"
                >
                  Title
                </label>
                <input
                  id="editTitle"
                  type="text"
                  class="form-control form-control-lg bg-light border-0 rounded-3"
                  v-model="editTitle"
                />
              </div>

              <div class="mb-4">
                <label
                  for="editContent"
                  class="form-label fw-medium small text-uppercase text-muted"
                >
                  Content
                </label>
                <textarea
                  id="editContent"
                  class="form-control bg-light border-0 rounded-3"
                  rows="7"
                  v-model="editContent"
                ></textarea>
              </div>

              <div class="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  class="btn btn-light rounded-pill px-4"
                  :disabled="isUpdating"
                  @click="cancelEditing"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="btn btn-primary rounded-pill px-4 fw-medium"
                  :disabled="!canSaveEdit || isUpdating"
                >
                  <span
                    v-if="isUpdating"
                    class="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  <i v-else class="bi bi-check-lg me-1"></i>
                  {{ isUpdating ? "Saving..." : "Save Changes" }}
                </button>
              </div>
            </form>

            <!-- Read Mode -->
            <div v-else>
              <h1 class="fw-bold mb-4 post-heading">{{ post.title }}</h1>
              <div class="text-secondary post-body">{{ post.content }}</div>
            </div>
          </div>
        </article>

        <!-- Comments Section Card -->
        <section class="card border-0 shadow-sm rounded-4">
          <div class="card-body p-4 p-md-5">
            <!-- Comments Header -->
            <div class="d-flex align-items-center justify-content-between mb-4">
              <h5 class="fw-bold mb-0 d-flex align-items-center gap-2">
                <i class="bi bi-chat-dots text-primary"></i>
                Comments
                <span
                  class="badge rounded-pill bg-primary bg-opacity-10 text-primary fw-semibold"
                >
                  {{ comments.length }}
                </span>
              </h5>
            </div>

            <!-- Add Comment Form (Visible to Anyone) -->
            <form @submit.prevent="handleAddComment" class="mb-4 pb-4 border-bottom">
              <div class="d-flex align-items-center justify-content-between mb-2">
                <label
                  for="commentInput"
                  class="form-label small fw-medium text-muted mb-0"
                >
                  Add a comment
                </label>
                <span class="small text-muted">
                  <i class="bi bi-person-circle me-1"></i>
                  {{ user.email || "Guest" }}
                </span>
              </div>

              <textarea
                id="commentInput"
                class="form-control bg-light border-0 rounded-3 mb-3"
                rows="3"
                v-model="newComment"
                placeholder="Share your thoughts on this post..."
              ></textarea>

              <div class="d-flex justify-content-end">
                <button
                  type="submit"
                  class="btn btn-primary rounded-pill px-4 fw-medium"
                  :disabled="!newComment.trim() || isSubmittingComment"
                >
                  <span
                    v-if="isSubmittingComment"
                    class="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  <i v-else class="bi bi-send-fill me-2"></i>
                  {{ isSubmittingComment ? "Posting..." : "Post Comment" }}
                </button>
              </div>
            </form>

            <!-- Empty Comments State -->
            <div v-if="comments.length === 0" class="text-center py-4 text-muted">
              <i class="bi bi-chat-square-text fs-2 d-block mb-2 opacity-50"></i>
              <p class="mb-0 small">No comments yet. Start the conversation above.</p>
            </div>

            <!-- Comments List -->
            <div v-else class="d-flex flex-column gap-3">
              <div
                v-for="(comment, index) in comments"
                :key="comment._id || index"
                class="p-3 rounded-3 bg-light"
              >
                <div class="d-flex align-items-center justify-content-between gap-2 mb-2">
                  <div class="d-flex align-items-center gap-2 overflow-hidden">
                    <div
                      class="rounded-circle bg-white text-primary border fw-bold d-flex align-items-center justify-content-center flex-shrink-0"
                      style="width: 30px; height: 30px; font-size: 0.78rem"
                    >
                      {{ getInitial(getCommentAuthorEmail(comment)) }}
                    </div>
                    <span class="fw-semibold small text-dark text-truncate">
                      {{ getCommentAuthorEmail(comment) }}
                    </span>
                  </div>
                  <span v-if="formatDate(comment)" class="text-muted flex-shrink-0" style="font-size: 0.75rem">
                    {{ formatDate(comment) }}
                  </span>
                </div>
                <p class="mb-0 small text-secondary ps-1 comment-body">
                  {{ getCommentText(comment) }}
                </p>
              </div>
            </div>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

