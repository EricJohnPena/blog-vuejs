<script setup>
import { ref, computed, onMounted } from "vue";
import api from "../api.js";
import { Notyf } from "notyf";
import { useGlobalStore } from "../stores/user.js";

const posts = ref([]);
const isLoading = ref(false);
const isSubmitting = ref(false);
const showComposer = ref(false);
const searchQuery = ref("");

const title = ref("");
const content = ref("");

const notyf = new Notyf();
const { user } = useGlobalStore();

const isEnabled = computed(
  () => title.value.trim().length > 0 && content.value.trim().length > 0
);

const filteredPosts = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return posts.value;

  return posts.value.filter((post) => {
    const postTitle = (post.title || "").toLowerCase();
    const postContent = (post.content || "").toLowerCase();
    const author = (
      post.author?.username ||
      post.author?.email ||
      ""
    ).toLowerCase();

    return postTitle.includes(q) || postContent.includes(q) || author.includes(q);
  });
});

function getAuthorLabel(post) {
  return post.author?.username || post.author?.email || "Unknown Author";
}

function getAuthorInitial(post) {
  return getAuthorLabel(post).charAt(0).toUpperCase();
}

function formatDate(post) {
  const rawDate = post.createdAt || post.dateCreated || post.createdOn;
  if (!rawDate) return null;

  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

async function fetchPosts() {
  isLoading.value = true;

  try {
    const { data } = await api.get("/posts/all");
    posts.value = Array.isArray(data) ? data : data.posts || [];
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    notyf.error("Could not load blog posts.");
  } finally {
    isLoading.value = false;
  }
}

async function handleSubmit() {
  if (!isEnabled.value || isSubmitting.value) return;

  isSubmitting.value = true;

  try {
    const response = await api.post("posts/add-post", {
      title: title.value.trim(),
      content: content.value.trim(),
    });

    if (response.status === 201 || response.status === 200) {
      title.value = "";
      content.value = "";
      showComposer.value = false;
      notyf.success("New post published!");
      await fetchPosts();
    } else {
      notyf.error(response.data?.message || "Could not publish post.");
    }
  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data?.message;

    if (status === 409 && message) {
      notyf.error(message);
    } else if (status === 401 || status === 403) {
      notyf.error("Please log in to create a post.");
    } else {
      console.error(message || error);
      notyf.error("Error adding post. Please contact administrator.");
    }
  } finally {
    isSubmitting.value = false;
  }
}

onMounted(() => {
  fetchPosts();
});
</script>

<template>
  <div class="bg-light min-vh-100 py-5">
    <div class="container" style="max-width: 1120px">
      <!-- Page Header -->
      <div
        class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 pb-4 mb-4 border-bottom"
      >
        <div>
          <span
            class="badge rounded-pill bg-primary bg-opacity-10 text-primary fw-semibold px-3 py-2 mb-2"
          >
            <i class="bi bi-journal-richtext me-1"></i> Community Blog
          </span>
          <h1 class="fw-bold tracking-tight mb-1">Latest Posts</h1>
          <p class="text-secondary mb-0">
            Read stories, ideas, and updates from the community.
          </p>
        </div>

        <div class="d-flex align-items-center gap-2">
          <button
            v-if="user.token"
            type="button"
            class="btn rounded-pill px-4 py-2 fw-medium shadow-sm"
            :class="showComposer ? 'btn-outline-secondary' : 'btn-primary'"
            @click="showComposer = !showComposer"
          >
            <i
              class="bi me-2"
              :class="showComposer ? 'bi-x-lg' : 'bi-pencil-square'"
            ></i>
            {{ showComposer ? "Close Editor" : "Write a Post" }}
          </button>

          <router-link
            v-else
            to="/login"
            class="btn btn-outline-primary rounded-pill px-4 py-2 fw-medium"
          >
            <i class="bi bi-box-arrow-in-right me-2"></i>Sign in to Post
          </router-link>
        </div>
      </div>

      <!-- Collapsible Post Composer (Logged-in users) -->
      <div
        v-if="user.token && showComposer"
        class="card border-0 shadow-sm rounded-4 mb-5"
      >
        <div class="card-body p-4 p-md-5">
          <div class="d-flex align-items-center justify-content-between mb-4">
            <h5 class="fw-bold mb-0">
              Create a New Post
            </h5>
            <span class="text-muted small">
              <i class="bi bi-person-circle me-1"></i>{{ user.email }}
            </span>
          </div>

          <form @submit.prevent="handleSubmit">
            <div class="mb-3">
              <label for="titleInput" class="form-label fw-medium small text-uppercase text-muted">
                Title
              </label>
              <input
                type="text"
                class="form-control form-control-lg bg-light border-0 rounded-3"
                id="titleInput"
                v-model="title"
                placeholder="Give your post a clear, engaging title..."
              />
            </div>

            <div class="mb-4">
              <label for="contentInput" class="form-label fw-medium small text-uppercase text-muted">
                Content
              </label>
              <textarea
                class="form-control bg-light border-0 rounded-3"
                id="contentInput"
                v-model="content"
                rows="5"
                placeholder="Share your thoughts here..."
              ></textarea>
            </div>

            <div class="d-flex justify-content-end gap-2">
              <button
                type="button"
                class="btn btn-light rounded-pill px-4"
                @click="showComposer = false"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="btn btn-primary rounded-pill px-4 fw-medium"
                :disabled="!isEnabled || isSubmitting"
              >
                <span
                  v-if="isSubmitting"
                  class="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                <i v-else class="bi bi-send-fill me-2"></i>
                {{ isSubmitting ? "Publishing..." : "Publish Post" }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Search & Feed Toolbar -->
      <div
        class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4"
      >
        <div class="text-muted small fw-medium">
          <i class="bi bi-collection me-1"></i>
          Showing {{ filteredPosts.length }}
          {{ filteredPosts.length === 1 ? "post" : "posts" }}
        </div>

        <div class="input-group" style="max-width: 320px">
          <span class="input-group-text bg-white border-end-0 rounded-start-pill ps-3 text-muted">
            <i class="bi bi-search"></i>
          </span>
          <input
            type="text"
            class="form-control bg-white border-start-0 rounded-end-pill pe-3 shadow-none"
            v-model="searchQuery"
            placeholder="Search posts or authors..."
          />
          <button
            v-if="searchQuery"
            type="button"
            class="btn btn-link text-muted text-decoration-none px-2"
            @click="searchQuery = ''"
            aria-label="Clear search"
          >
            <i class="bi bi-x-circle-fill"></i>
          </button>
        </div>
      </div>

      <!-- Loading Skeletons -->
      <div v-if="isLoading" class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
        <div v-for="n in 6" :key="n" class="col">
          <div class="card h-100 border-0 shadow-sm rounded-4 p-4 placeholder-glow">
            <div class="d-flex align-items-center gap-2 mb-3">
              <span class="placeholder rounded-circle" style="width: 34px; height: 34px"></span>
              <span class="placeholder col-5 rounded"></span>
            </div>
            <span class="placeholder col-9 mb-2 rounded py-2"></span>
            <span class="placeholder col-12 mb-1 rounded"></span>
            <span class="placeholder col-10 mb-1 rounded"></span>
            <span class="placeholder col-6 rounded"></span>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="filteredPosts.length === 0"
        class="card border-0 shadow-sm rounded-4 text-center py-5 px-4"
      >
        <div class="card-body">
          <div
            class="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 text-primary mb-3"
            style="width: 64px; height: 64px"
          >
            <i class="bi bi-journal-text fs-2"></i>
          </div>
          <h5 class="fw-bold mb-1">
            {{ searchQuery ? "No matching posts found" : "No posts yet" }}
          </h5>
          <p class="text-muted mb-3">
            {{
              searchQuery
                ? "Try searching with a different keyword."
                : "Be the first to share something with the community."
            }}
          </p>
          <button
            v-if="searchQuery"
            type="button"
            class="btn btn-outline-secondary rounded-pill px-4"
            @click="searchQuery = ''"
          >
            Clear Search
          </button>
          <button
            v-else-if="user.token && !showComposer"
            type="button"
            class="btn btn-primary rounded-pill px-4"
            @click="showComposer = true"
          >
            <i class="bi bi-pencil-square me-2"></i>Write the First Post
          </button>
        </div>
      </div>

      <!-- Posts Grid -->
      <div v-else class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
        <div v-for="post in filteredPosts" :key="post._id" class="col">
          <article class="card h-100 border-0 shadow-sm rounded-4 post-card">
            <div class="card-body d-flex flex-column p-4">
              <!-- Author & Date Row -->
              <div class="d-flex align-items-center gap-2 mb-3">
                <div
                  class="rounded-circle bg-primary bg-opacity-10 text-primary fw-bold d-flex align-items-center justify-content-center flex-shrink-0"
                  style="width: 34px; height: 34px; font-size: 0.85rem"
                >
                  {{ getAuthorInitial(post) }}
                </div>
                <div class="overflow-hidden">
                  <div class="fw-medium small text-dark text-truncate">
                    {{ getAuthorLabel(post) }}
                  </div>
                  <div v-if="formatDate(post)" class="text-muted" style="font-size: 0.75rem">
                    <i class="bi bi-calendar3 me-1"></i>{{ formatDate(post) }}
                  </div>
                </div>
              </div>

              <!-- Title & Excerpt -->
              <h5 class="card-title fw-bold mb-2 post-title">
                {{ post.title }}
              </h5>
              <p class="card-text text-secondary small flex-grow-1 post-excerpt mb-4">
                {{ post.content }}
              </p>

              <!-- Card Footer Action -->
<div
  class="pt-3 border-top border-light-subtle d-flex justify-content-between align-items-center"
>
  <router-link
    :to="`/posts/${post._id}`"
    class="link-primary text-decoration-none fw-semibold small d-inline-flex align-items-center gap-1 read-more-link"
  >
    Read article
    <i class="bi bi-arrow-right"></i>
  </router-link>

  <router-link
    :to="`/posts/${post._id}`"
    class="text-muted text-decoration-none small d-inline-flex align-items-center gap-1"
    :title="`${post.comments?.length || 0} ${(post.comments?.length || 0) === 1 ? 'comment' : 'comments'}`"
  >
    <i class="bi bi-chat-dots"></i>
    <span>{{ post.comments?.length || 0 }}</span>
  </router-link>
</div>
            </div>
          </article>
        </div>
      </div>
    </div>
  </div>
</template>

