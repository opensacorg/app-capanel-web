export default ({ env }: { env: any }) => ({
  // Enable users-permissions plugin
  "users-permissions": {
    config: {
      jwt: {
        expiresIn: "7d",
      },
    },
  },
});
