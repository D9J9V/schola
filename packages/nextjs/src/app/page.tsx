import Container from "@/app/_components/container";
import { HeroPost } from "@/app/_components/hero-post";
import { Intro } from "@/app/_components/intro";
import { MoreStories } from "@/app/_components/more-stories";
import { getAllPosts } from "@/lib/api";
import { Card } from "@/app/_components/Card";
import Subscribe from "@/app/_components/subscribe";
import Deck from "@/app/_components/deck";

export default function Index() {
  const allPosts = getAllPosts();
  //const heroPost = allPosts[0];
  const morePosts = allPosts.slice(0);

  return (
    <main>
      <Container>
        <Intro />
        <Card />
        {/*<HeroPost
          title={heroPost.title}
          coverImage={heroPost.coverImage}
          date={heroPost.date}
          author={heroPost.author}
          slug={heroPost.slug}
          excerpt={heroPost.excerpt}
        />*/}
        {morePosts.length > 0 && <MoreStories posts={morePosts} />}
      </Container>
      <Subscribe />
      <Deck />
    </main>
  );
}
