<template>
  <div class="m-header">
    <el-row>
      <el-col>
        <topBar />
      </el-col>
    </el-row>
    <el-row>
      <el-col>
        <searchBar />
      </el-col>
    </el-row>
  </div>
</template>

<script>
import topBar from "./topBar.vue";
import searchBar from "./searchBar.vue";
export default {
  components: {
    topBar,
    searchBar
  }
};
</script>

<style lang="scss">
@import "@/assets/css/public/header/index.scss";
</style>