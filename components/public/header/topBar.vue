<template>
  <el-row :gutter="0" class="m-header">
    <el-col :span="5">
      <Geo />
    </el-col>
    <el-col :span="5">
      <User />
    </el-col>
    <el-col :span="14">
      <Nav />
    </el-col>
  </el-row>
</template>

<script>
import Geo from "./geo.vue";
import User from "./user.vue";
import Nav from "./nav.vue";
export default {
  components: {
    Geo,
    User,
    Nav
  }
};
</script>

<style lang="scss">
@import "@/assets/css/public/layout.scss";
@import "@/assets/css/public/header/index.scss";
</style>